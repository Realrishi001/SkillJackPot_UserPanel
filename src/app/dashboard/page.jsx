"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  Play,
  RotateCcw,
  Printer,
  Zap,
  TrendingUp,
  Target,
} from "lucide-react";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import ShowResult from "../../Components/ShowResult/ShowResult";
import { FP_SETS } from "../../data/fpSets";
import axios from "axios";
import { DRAW_TIMES } from "../../data/drawTimes";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import AdvanceDrawModal from "../../Components/AdvanceDrawModal/AdvanceDrawModal.jsx";
import { useRouter } from "next/navigation.js";

// At the top of your component function:
// { '50': { '00': 1, ... }, '31': {...} }

// Helper for number ranges
const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, k) => k + start);

const numberBoxColors = [
  "bg-gradient-to-r from-red-400 to-red-600",
  "bg-gradient-to-r from-orange-400 to-orange-500",
  "bg-gradient-to-r from-pink-400 to-pink-500",
  "bg-gradient-to-r from-yellow-200 to-yellow-400",
  "bg-gradient-to-r from-cyan-400 to-blue-400",
  "bg-gradient-to-r from-yellow-400 to-yellow-500",
  "bg-gradient-to-r from-blue-400 to-blue-700",
  "bg-gradient-to-r from-gray-400 to-gray-500",
  "bg-gradient-to-r from-green-300 to-green-500",
  "bg-gradient-to-r from-red-400 to-red-600",
];

const allNumbers = [
  range(10, 19), // Col 1
  range(30, 39), // Col 2
  range(50, 59), // Col 3
];

const isOdd = (n) => n % 2 === 1;
const isEven = (n) => n % 2 === 0;
const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

// --- Timer & Date Helpers --- //
function getTodayDateString() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")} ${d.toLocaleString("en", {
    month: "short",
  })} ${d.getFullYear()}`;
}

function parseTimeToToday(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  );
}

// draw point function
function getNextDrawSlot(drawTimes) {
  const now = new Date();
  const timeObjects = drawTimes.map((timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );
  });

  for (let i = 0; i < timeObjects.length; i++) {
    if (now < timeObjects[i]) {
      return drawTimes[i];
    }
  }
  return drawTimes[0]; // First slot of next day
}

function getRemainTime() {
  if (typeof window === "undefined") return 0;

  const nextSlot = getNextDrawSlot(DRAW_TIMES); // e.g., "3:00 PM"
  const now = new Date();
  const nextSlotDate = parseTimeToToday(nextSlot);

  // If the current time has passed the slot, assume next day
  if (now > nextSlotDate) {
    nextSlotDate.setDate(nextSlotDate.getDate() + 1);
  }

  const remainMs = nextSlotDate - now;
  return Math.max(0, Math.floor(remainMs / 1000)); // in seconds
}

function setTimerEnd(secs) {
  localStorage.setItem(TIMER_KEY, Date.now() + secs * 1000);
}
function recalcQuantitiesAndPoints(selectedState) {
  // selectedState: 10x3 boolean array
  const newQuantities = Array(10).fill(0);
  const newPoints = Array(10).fill(0);

  for (let row = 0; row < 10; row++) {
    let count = 0;
    for (let col = 0; col < 3; col++) {
      if (selectedState[row][col]) count++;
    }
    newQuantities[row] = count;
    newPoints[row] = count * 2;
  }

  return { newQuantities, newPoints };
}

export default function Page() {
  useEffect(() => {
    setActiveTypeFilter("all"); // select All on mount
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("userToken")) {
      router.push("/");
    }
  }, []);

  const [selected, setSelected] = useState(
    Array(10)
      .fill(null)
      .map(() => Array(3).fill(false))
  );

  useEffect(() => {
    const savedSelected = localStorage.getItem("selected");
    if (savedSelected) {
      const parsedSelected = JSON.parse(savedSelected);
      setSelected(parsedSelected);

      // 🟡 Also recalc quantities/points here
      const { newQuantities, newPoints } =
        recalcQuantitiesAndPoints(parsedSelected);
      setQuantities(newQuantities);
      setPoints(newPoints);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("selected", JSON.stringify(selected));
  }, [selected]);
  const [activeFilter, setActiveFilter] = useState(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // <-- STEP 2
  }, []);

  // const [quantities, setQuantities] = useState(Array(10).fill(0));
  // const [points, setPoints] = useState(Array(10).fill(0));

  const [activeTypeFilter, setActiveTypeFilter] = useState(null); // 'all', 'odd', 'even', 'fp', or null
  const [activeColFilter, setActiveColFilter] = useState([]); // '10-19', '30-39', '50-59', or null

  // Constant Quantity and Points for demo (change values as needed)
  const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [points, setPoints] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // Initial points for each row
  const totalQuantity = quantities.reduce((a, b) => a + b, 0);
  const totalPoints = points.reduce((a, b) => a + b, 0);

  const [inputsByCheckBox, setInputsByCheckBox] = useState({});
// Replace your existing useMemo with this:

// Replace your useMemo with this corrected version:

// 3. Replace with this SINGLE useMemo (remove any others):
const [updatedQuantity, updatedPoints] = React.useMemo(() => {
  let qty = Array(10).fill(0);
  let amt = Array(10).fill(0);

  console.log("=== DEBUGGING CALCULATION ===");
  console.log("selected state:", selected);
  console.log("inputsByCheckBox:", inputsByCheckBox);

  // Check if we have any selected checkboxes at all
  let hasSelected = false;
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 3; col++) {
      if (selected[row][col]) {
        hasSelected = true;
        const num = allNumbers[col][row];
        const numStr = String(num).padStart(2, "0");
        
        console.log(`✓ Processing checkbox: row=${row}, col=${col}, num=${num}, numStr=${numStr}`);
        
        // Get all grid values for this checkbox
        const checkboxInputs = inputsByCheckBox[numStr] || {};
        console.log(`  Checkbox ${numStr} inputs:`, checkboxInputs);
        
        let totalForThisCheckbox = 0;
        
        Object.entries(checkboxInputs).forEach(([cellKey, value]) => {
          console.log(`    Cell ${cellKey}: value="${value}"`);
          const n = parseInt(value, 10);
          if (!isNaN(n) && n > 0) {
            totalForThisCheckbox += n;
            console.log(`      ✓ Added ${n}, running total: ${totalForThisCheckbox}`);
          } else {
            console.log(`      ✗ Skipped value "${value}" (not a positive number)`);
          }
        });
        
        // Add to the row corresponding to this checkbox
        qty[row] += totalForThisCheckbox;
        amt[row] += totalForThisCheckbox * 2;
        
        console.log(`  ✓ Final for checkbox ${numStr}: total=${totalForThisCheckbox}, qty[${row}]=${qty[row]}, amt[${row}]=${amt[row]}`);
      }
    }
  }

  if (!hasSelected) {
    console.log("❌ No checkboxes are selected!");
  }

  console.log("Final calculated quantities:", qty);
  console.log("Final calculated amounts:", amt);
  console.log("=== END DEBUGGING ===");

  return [qty, amt];
}, [inputsByCheckBox, selected]);// Keep 'selected' in dependency to trigger recalculation when checkboxes change
  





  useEffect(() => {
  console.log("Updated Quantities:", updatedQuantity);
  console.log("Updated Points:", updatedPoints);
}, [updatedQuantity, updatedPoints]);

  const totalUpdatedQuantity = updatedQuantity.reduce((a, b) => a + b, 0);
  const totalUpdatedPoints = updatedPoints.reduce((a, b) => a + b, 0);

  const [isFPMode, setIsFPMode] = useState(false);
  const [activeFPSetIndex, setActiveFPSetIndex] = useState(null);
  const [currentDrawSlot, setCurrentDrawSlot] = useState(() =>
    getNextDrawSlot(DRAW_TIMES)
  );
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceDrawTimes, setAdvanceDrawTimes] = useState([]);
  const [activeCheckBox, setActiveCheckBox] = useState(null); // Number currently being entered, eg '50' or '31'

  const COLS = 10,
    ROWS = 10; // or 9 if that's your grid size

  const [columnHeaders, setColumnHeaders] = useState(Array(COLS).fill(""));
  const [rowHeaders, setRowHeaders] = useState(Array(ROWS).fill(""));
  const [grid, setGrid] = useState(
    Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(""))
  );
  const [cellOverrides, setCellOverrides] = useState({});
  const [showAdvanceDrawModal, setShowAdvanceDrawModal] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [maxQuantities, setMaxQuantities] = useState(Array(10).fill(0));


  useEffect(() => {
  console.log("DEBUG updatedQuantity", updatedQuantity);
}, [updatedQuantity]);

  useEffect(() => {
    localStorage.setItem("updatedQuantity", JSON.stringify(updatedQuantity));
    localStorage.setItem("updatedPoints", JSON.stringify(updatedPoints));
  }, [updatedQuantity, updatedPoints]);
  useEffect(() => {
  setQuantities(updatedQuantity);
  setPoints(updatedPoints);
}, [updatedQuantity, updatedPoints]);


  // Handlers:
  const handleRowHeaderChange = (row, value) => {
    if (!/^-?\d*$/.test(value)) return;

    setRowHeaders((headers) => headers.map((v, i) => (i === row ? value : v)));

    setCellOverrides((overrides) => {
      const updated = { ...overrides };
      const rowValue = value === "" ? null : parseInt(value, 10);

      for (let col = 0; col < 10; col++) {
        const key = `${row}-${col}`;
        const colVal =
          columnHeaders[col] === "" ? null : parseInt(columnHeaders[col], 10);

        if (rowValue === null && colVal === null) {
          delete updated[key];
        } else if (rowValue === null) {
          updated[key] = String(colVal);
        } else if (colVal === null) {
          updated[key] = String(rowValue);
        } else {
          updated[key] = String(rowValue + colVal);
        }
      }
      return updated;
    });
  };

  const handleColumnHeaderChange = (col, value) => {
    if (!/^-?\d*$/.test(value)) return;

    setColumnHeaders((headers) =>
      headers.map((v, i) => (i === col ? value : v))
    );

    setCellOverrides((overrides) => {
      const updated = { ...overrides };
      const colValue = value === "" ? null : parseInt(value, 10);

      for (let row = 0; row < 10; row++) {
        const key = `${row}-${col}`;
        const rowVal =
          rowHeaders[row] === "" ? null : parseInt(rowHeaders[row], 10);

        if (colValue === null && rowVal === null) {
          delete updated[key];
        } else if (colValue === null) {
          updated[key] = String(rowVal);
        } else if (rowVal === null) {
          updated[key] = String(colValue);
        } else {
          updated[key] = String(rowVal + colValue);
        }
      }
      return updated;
    });
  };

  // --- Timer logic ---
  const [remainSecs, setRemainSecs] = useState(() => getRemainTime());
  const timerRef = useRef();

  useEffect(() => {
    const savedInputs = localStorage.getItem("inputsByCheckBox");
    if (savedInputs) setInputsByCheckBox(JSON.parse(savedInputs));

    const savedQuantities = localStorage.getItem("quantities");
    if (savedQuantities) setQuantities(JSON.parse(savedQuantities));

    const savedPoints = localStorage.getItem("points");
    if (savedPoints) setPoints(JSON.parse(savedPoints));
  }, []);

  // --- Save to localStorage on changes ---
  useEffect(() => {
    localStorage.setItem("inputsByCheckBox", JSON.stringify(inputsByCheckBox));
  }, [inputsByCheckBox]);

  useEffect(() => {
    localStorage.setItem("quantities", JSON.stringify(quantities));
  }, [quantities]);

  useEffect(() => {
    localStorage.setItem("points", JSON.stringify(points));
  }, [points]);

  useEffect(() => {
    setRemainSecs(getRemainTime()); // Set initial value
    timerRef.current = setInterval(() => {
      setRemainSecs(getRemainTime());
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (remainSecs === 0) {
      setCurrentDrawSlot(getNextDrawSlot(DRAW_TIMES)); // Just update the slot
    }
  }, [remainSecs]);

  // update the slots every 5 seconds to keep checking
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDrawSlot(getNextDrawSlot(DRAW_TIMES));
    }, 5000); // check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const min = String(Math.floor(remainSecs / 60)).padStart(2, "0");
  const sec = String(remainSecs % 60).padStart(2, "0");
  const remainTime = `${min}:${sec}`;
  const [confirmedTickets, setConfirmedTickets] = useState([]);

  const drawTimeObj = new Date(Date.now() + remainSecs * 1000);
  const drawTime = drawTimeObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const drawDate = getTodayDateString();

  // --- Checkboxes --- //
  const toggle = (row, col, isLeftGrid = false) => {
    const num = allNumbers[col][row];
    const numStr = String(num).padStart(2, "0");

    // 1. Toggle the checkbox selection state
    setSelected((prev) => {
      const copy = prev.map((arr) => arr.slice());
      copy[row][col] = !copy[row][col];
      return copy;
    });

    // 2. Set the active checkbox for the grid input
    setActiveCheckBox(numStr);

    // 3. Ensure there's a mapping for this checkbox in inputsByCheckBox
    setInputsByCheckBox((prev) => {
      if (!(numStr in prev)) {
        return { ...prev, [numStr]: {} };
      }
      return prev;
    });

    // 4. Show the current grid state for this checkbox
    setCellOverrides(inputsByCheckBox[numStr] || {});
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "F10") {
        e.preventDefault();
        resetCheckboxes();
      }
      if (e.key === "F7") {
        e.preventDefault();
        handleFilter("10-19");
      }
      if (e.key === "F8") {
        e.preventDefault();
        handleFilter("30-39");
      }
      if (e.key === "F9") {
        e.preventDefault();
        handleFilter("50-59");
      }
      if (e.key === "F6") {
        e.preventDefault();
        handlePrint();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [activeFilter]);

  // --- Column/Range Filters for F7/F8/F9 --- //
  const handleFilter = (colKey) => {
    let colIndex = null;
    if (colKey === "10-19") colIndex = 0;
    else if (colKey === "30-39") colIndex = 1;
    else if (colKey === "50-59") colIndex = 2;

    const allSelected = selected.every((rowArr) => rowArr[colIndex]);

    setSelected((prev) => {
      const copy = prev.map((arr) => arr.slice());
      for (let row = 0; row < 10; row++) {
        copy[row][colIndex] = !allSelected;
      }
      return copy;
    });

    setInputsByCheckBox((prev) => {
      let updated = { ...prev };
      for (let row = 0; row < 10; row++) {
        const num = allNumbers[colIndex][row];
        const numStr = String(num).padStart(2, "0");
        if (!allSelected) {
          // Just ensure the object exists, but don't prefill any cell
          if (!updated[numStr]) updated[numStr] = {};
        } else {
          // Deselect: remove entirely
          delete updated[numStr];
        }
      }
      return updated;
    });

    setActiveColFilter((prev) => {
      const set = new Set(prev);
      if (set.has(colKey)) set.delete(colKey);
      else set.add(colKey);
      return Array.from(set);
    });
  };

  const handleOddEvenFP = (type) => {
    setActiveTypeFilter(type);
  };

 const resetCheckboxes = () => {
  setSelected(
    Array(10)
      .fill(null)
      .map(() => Array(3).fill(false))
  );
  
  // Reset the state variables
  setQuantities(Array(10).fill(0));
  setPoints(Array(10).fill(0));
  
  setCellOverrides({});
  setInputsByCheckBox({});
  setActiveCheckBox(null);
  setActiveTypeFilter("all");
  setActiveColFilter([]);
  setRowHeaders(Array(10).fill(""));
  setColumnHeaders(Array(10).fill(""));
  setMaxQuantities(Array(10).fill(0));
  setAdvanceDrawTimes([]);
  setConfirmedTickets([]);
  setShowAdvanceDrawModal(false);

  // Remove localStorage keys
  [
    "selected",
    "quantities",
    "points",
    "inputsByCheckBox",
    "updatedQuantity",
    "updatedPoints",
    "totalUpdatedQuantity",
    "totalUpdatedPoints",
  ].forEach((key) => localStorage.removeItem(key));
};

  useEffect(() => {
    // --- Calculate totals from all checkboxes (inputsByCheckBox) ---
    let totalValue = 0;
    let updatedQuantity = Array(10).fill(0);
    let updatedPoints = Array(10).fill(0);

    Object.values(inputsByCheckBox).forEach((inputs) => {
      Object.entries(inputs).forEach(([key, v]) => {
        const [row, col] = key.split("-").map(Number);
        const val = parseInt(v, 10);
        if (!isNaN(val)) {
          totalValue += val;
          updatedQuantity[row] += val;
          updatedPoints[row] += val * 2;
        }
      });
    });

    // --- Save to localStorage ---
    localStorage.setItem("inputsByCheckBox", JSON.stringify(inputsByCheckBox));
    localStorage.setItem(
      "totalUpdatedQuantity",
      updatedQuantity.reduce((a, b) => a + b, 0)
    );
    localStorage.setItem(
      "totalUpdatedPoints",
      updatedPoints.reduce((a, b) => a + b, 0)
    );

    // --- Optional: For your debugging ---
    console.log("Quantities per row:", updatedQuantity);
    console.log("Total value:", totalValue);
    console.log("Updated quantity:", updatedQuantity);
  }, [inputsByCheckBox]);

  useEffect(() => {
    let ticketList = [];

    // 1. Get all selected numbers (from checkboxes)
    let selectedNumbers = [];
    for (let colIdx = 0; colIdx < allNumbers.length; colIdx++) {
      for (let rowIdx = 0; rowIdx < allNumbers[colIdx].length; rowIdx++) {
        if (selected[rowIdx][colIdx]) {
          selectedNumbers.push(allNumbers[colIdx][rowIdx]);
        }
        
      }
    }

    // 2. Get all input cells with values
    let filledCells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const key = `${row}-${col}`;
        const num = row * 10 + col;
        const isEven = num % 2 === 0;
        const isOdd = !isEven;

        if (
          (activeTypeFilter === "even" && isOdd) ||
          (activeTypeFilter === "odd" && isEven)
        ) {
          continue; // skip invalid
        }

        const value = cellOverrides[key];
        if (value && value !== "") {
          const cellNum = row * 10 + col;
          filledCells.push({
            cellIndex: String(cellNum).padStart(2, "0"),
            value,
          });
        }
      }
    }

    // 3. For every selected number and every filled input, create the ticket
    selectedNumbers.forEach((num) => {
      filledCells.forEach((cell) => {
        ticketList.push(`${num}-${cell.cellIndex} : ${cell.value}`);
      });
    });

    console.log("Selected Ticket Numbers:", ticketList);
  }, [selected, cellOverrides]);

  const handleGridChange = (row, col, value) => {
    if (!/^\d*$/.test(value)) return;
    const cellKey = `${row}-${col}`;
    // Update visible grid
    setCellOverrides((overrides) => ({
      ...overrides,
      [cellKey]: value,
    }));
    // Update inputs for this checkbox
    if (activeCheckBox) {
      setInputsByCheckBox((prev) => ({
        ...prev,
        [activeCheckBox]: {
          ...(prev[activeCheckBox] || {}),
          [cellKey]: value,
        },
      }));
    }
  };

  function getCellValue(row, col) {
    const key = `${row}-${col}`;
    if (cellOverrides[key] !== undefined && cellOverrides[key] !== "") {
      return cellOverrides[key];
    }
    return "";
  }

  function getFPSetIndexForNumber(numStr) {
    return FP_SETS.findIndex((set) => set.includes(numStr));
  }

  function getLoginIdFromToken() {
    const token = localStorage.getItem("userToken");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (e) {
      return null;
    }
  }

  function getFormattedDateTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(now.getDate())}-${pad(
      now.getMonth() + 1
    )}-${now.getFullYear()} ${pad(now.getHours())}:${pad(
      now.getMinutes()
    )}:${pad(now.getSeconds())}`;
  }

  const generatePrintReceipt = (data, ticketId) => {
    // Create a new jsPDF instance
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",

      format: [80, 297], // 80mm width for thermal printer
    });

    // Set font
    pdf.setFontSize(10);

    // Header
    pdf.text("Skill Jackpot", 40, 10, { align: "center" });
    pdf.setFontSize(8);
    pdf.text("This game for Adults Amusement Only", 40, 15, {
      align: "center",
    });
    pdf.text("GST No Issued by Govt of India", 40, 20, { align: "center" });
    pdf.text("GST No: In Process", 40, 25, { align: "center" });
    pdf.text(`Date: ${data.gameTime}`, 40, 30, { align: "center" });

    // Add a line
    pdf.setLineWidth(0.5);
    pdf.line(5, 33, 75, 33);

    // Game Time
    pdf.setFontSize(9);
    const drawTimeText = Array.isArray(data.drawTime)
      ? data.drawTime.length > 1
        ? `Draw Times: ${data.drawTime.join(", ")}`
        : `Draw Time: ${data.drawTime[0]}`
      : `Draw Time: ${data.drawTime}`;
    pdf.text(drawTimeText, 5, 38);

    pdf.text(`Login Id: ${data.loginId}`, 5, 43);

    // Add line
    pdf.line(5, 45, 75, 45);

    // Ticket Numbers in grid format
    let yPos = 50;
    const ticketArray = data.ticketNumber.split(", ");

    // Group tickets by row (3 per row as shown in image)
    for (let i = 0; i < ticketArray.length; i += 3) {
      let rowText = "";
      for (let j = 0; j < 3 && i + j < ticketArray.length; j++) {
        const ticket = ticketArray[i + j];
        // Format each ticket to fit nicely
        const formattedTicket = ticket.substring(0, 18); // Limit length
        rowText += formattedTicket.padEnd(25, " ");
      }
      pdf.setFontSize(7);
      pdf.text(rowText.trim(), 5, yPos);
      yPos += 4;
    }

    // Add line before totals
    pdf.line(5, yPos, 75, yPos);
    yPos += 5;

    // Total Quantity and Points
    pdf.setFontSize(10);
    pdf.text(`Total Quantity : ${data.totalQuatity}`, 5, yPos);
    yPos += 5;
    pdf.text(`Total Amount : ${data.totalPoints}`, 5, yPos);
    yPos += 8;

    // Generate barcode with dynamic ticket ID
    const barcodeValue = `SJ${ticketId}`; // Dynamic barcode with ticket ID
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeValue, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      margin: 5,
    });

    // Convert canvas to image and add to PDF
    const barcodeImage = canvas.toDataURL("image/png");
    pdf.addImage(barcodeImage, "PNG", 10, yPos, 60, 20);

    // Save or print the PDF
    // For direct printing (opens print dialog)
    pdf.autoPrint();
    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Open in new window for printing
    const printWindow = window.open(pdfUrl);
    printWindow.onload = function () {
      printWindow.print();
    };

    // Alternative: Save as file
    // pdf.save(`receipt_${ticketId}.pdf`);
  };

  const handlePrint = async () => {
    if (!canPrint) {
      if (remainSecs <= 30) {
        alert("Print is disabled during the last 30 seconds before draw time!");
      } else if (totalUpdatedQuantity === 0) {
        alert("No quantity selected or no tickets to print.");
      }
      return;
    }

    // 1. Build ticket list using the CORRECT mapping
    let ticketList = [];
    Object.entries(inputsByCheckBox).forEach(([num, cellMap]) => {
      Object.entries(cellMap).forEach(([cellIndex, value]) => {
        if (value && value !== "" && parseInt(value, 10) > 0) {
          ticketList.push(`${num}-${cellIndex} : ${value}`);
        }
      });
    });

    // 2. Get loginId from JWT
    const loginId = getLoginIdFromToken();
    if (!loginId) {
      alert("User not logged in.");
      return;
    }

    // 3. Get current date and time (formatted)
    const gameTime = getFormattedDateTime();

    // 4. Calculate multiplier and new totals
    const drawTimesArr =
      advanceDrawTimes.length > 0 ? advanceDrawTimes : [currentDrawSlot];
    const multiplier = drawTimesArr.length;
    const multipliedTotalQuantity = totalUpdatedQuantity * multiplier;
    const multipliedTotalPoints = totalUpdatedPoints * multiplier;

    // 5. Prepare data payload
    const payload = {
      gameTime,
      ticketNumber: ticketList.join(", "),
      totalQuatity: multipliedTotalQuantity,
      totalPoints: multipliedTotalPoints, // multiplied!
      loginId,
      drawTime: drawTimesArr,
    };

    // 6. Send data to backend (save ticket)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/saveTicket`,
        payload
      );

      if (response.status === 201) {
        const ticketId =
          response.data.ticketId || response.data.id || Date.now().toString();
        alert("Tickets saved successfully!");

        // 7. Subtract the balance from admin/shop (use multiplied points)
        try {
          const subtractRes = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/subtract-balance`,
            {
              id: loginId,
              amount: multipliedTotalPoints, // use multiplied value!
            }
          );
          if (!subtractRes.data.success) {
            alert(
              "Warning: Could not subtract balance: " + subtractRes.data.message
            );
          }
        } catch (e) {
          alert(
            "Error subtracting balance: " +
              (e?.response?.data?.message || e.message)
          );
        }

        // 8. Generate and print the receipt (use multiplied values)
        generatePrintReceipt(
          {
            gameTime: gameTime,
            drawTime: drawTimesArr,
            loginId: loginId,
            ticketNumber: ticketList.join(", "),
            totalQuatity: multipliedTotalQuantity,
            totalPoints: multipliedTotalPoints,
          },
          ticketId
        );

        // 9. Clear the form after printing
        resetCheckboxes();
        setCellOverrides({});
        setColumnHeaders(Array(10).fill(""));
        setRowHeaders(Array(10).fill(""));
      } else {
        alert(
          "Failed to save tickets: " +
            (response.data.message || "Unknown error")
        );
      }
    } catch (error) {
      alert(
        "Error saving tickets: " +
          (error?.response?.data?.message || error.message)
      );
    }
  };

  // Calculate total value (sum of all input boxes)
  let totalValue = 0;

  Object.values(cellOverrides).forEach((v) => {
    const num = parseInt(v, 10);
    if (!isNaN(num)) totalValue += num;
  });

  // Calculate updatedQuantity array
  // const updatedQuantity = maxQuantities.map((q) => totalValue * q);
  // const updatedPoints = updatedQuantity.map((q) => q * 2);
  // const totalUpdatedQuantity = updatedQuantity.reduce(
  //   (sum, val) => sum + val,
  //   0
  // );
  //const totalUpdatedPoints = updatedPoints.reduce((sum, val) => sum + val, 0);

  function getRowColForNumber(num) {
    for (let col = 0; col < allNumbers.length; col++) {
      for (let row = 0; row < allNumbers[col].length; row++) {
        if (allNumbers[col][row] === num) {
          return [row, col];
        }
      }
    }
    return null;
  }

  // Sum of values in a row
  function getRowSum(row) {
    let sum = 0;
    for (let col = 0; col < 10; col++) {
      const num = row * 10 + col;
      const isEven = num % 2 === 0;
      const isOdd = !isEven;

      if (
        (activeTypeFilter === "even" && isOdd) ||
        (activeTypeFilter === "odd" && isEven)
      ) {
        continue; // skip invalid cell
      }

      const key = `${row}-${col}`;
      const val = parseInt(cellOverrides[`${row}-${col}`], 10);
      if (!isNaN(val)) sum += val;
    }
    return sum;
  }

  const canPrint = remainSecs > 30 && totalUpdatedQuantity > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full h-fit">
        <ShowResult drawTime={currentDrawSlot} />
      </div>

      {/* Enhanced Draw Header */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center py-1 border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl backdrop-blur-sm px-6">
        {/* Filter Buttons */}
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center ">
          <button
            onClick={() => handleOddEvenFP("all")}
            className={`px-4 py-2.5 rounded font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeTypeFilter === "all"
                ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleOddEvenFP("even")}
            className={`px-5 py-2.5 rounded font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeTypeFilter === "even"
                ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
            }`}
          >
            Even
          </button>
          <button
            onClick={() => handleOddEvenFP("odd")}
            className={`px-5 py-2.5 rounded font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeTypeFilter === "odd"
                ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
            }`}
          >
            Odd
          </button>
          <button
            onClick={() => {
              // Toggle FP mode on/off
              setIsFPMode((v) => !v);
              setActiveFPSetIndex(null);
              setActiveTypeFilter("all"); // When FP is clicked, make "All" the active filter
            }}
            className={`px-5 py-2.5 rounded font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
              isFPMode
                ? "text-white bg-gradient-to-r from-green-600 to-lime-600 shadow-lg"
                : "text-[#4A314D] bg-[#ece6fc] border border-[#968edb] hover:bg-[#e5def7] shadow-md"
            }`}
          >
            FP
          </button>
        </div>
        {/* Remain Time Section */}
        <div className="flex items-center gap-2 px-6 py-1 bg-slate-800/80 rounded border border-red-500/30 shadow-lg mb-4 sm:mb-0">
          <Clock className="w-6 h-6 text-red-400 animate-pulse" />
          <span className="text-sm sm:text-sm font-bold text-green-400 tracking-wider">
            Remain Time
          </span>
          <span className="text-lg sm:text-xl font-mono font-bold text-red-400 bg-slate-900/50 px-3 py-1 rounded-lg">
            {mounted ? remainTime : "00:00"}
          </span>
        </div>

        {/* Draw Time and Draw Date Sections */}
        <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center sm:justify-start">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded border border-green-500/30 w-full sm:w-auto">
            <Play className="w-5 h-5 text-green-400" />
            <span className="text-sm sm:text-sm font-bold text-green-400">
              Draw Time
            </span>
            <span className="text-lg sm:text-md font-mono font-bold text-red-400">
              {currentDrawSlot}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded border border-green-500/30 w-full sm:w-auto">
            <Calendar className="w-5 h-5 text-green-400" />
            <span className="text-sm sm:text-sm font-bold text-green-400">
              Draw Date
            </span>
            <span className="text-lg sm:text-md font-mono font-bold text-red-400">
              {drawDate}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="flex flex-wrap p-2 gap-2">
        {/* Left Panel - Number Selectors, ODD EVEN FP */}
        <div className="rounded-2xl shadow-2xl bg-gradient-to-b from-slate-100/95 to-slate-300/80 p-2 border-2 border-gray-300/50 min-h-[700px] w-full lg:max-w-[320px] sm:w-[360px] backdrop-blur-sm">
          {/* Tabs for Filter */}
          <div className="flex gap-3 flex-wrap sm:flex-nowrap sm:w-auto w-full justify-center sm:justify-start mb-2 sm:mb-0">
            {[
              { key: "10-19", label: "F7 (10-19)" },
              { key: "30-39", label: "F8 (30-39)" },
              { key: "50-59", label: "F9 (50-59)" },
            ].map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => handleFilter(tab.key)}
                className={`px-4 py-1 rounded font-bold text-md text-white
                ${
                  Array.isArray(activeColFilter) &&
                  activeColFilter.includes(tab.key)
                    ? "bg-gradient-to-r from-purple-700 to-pink-600 scale-105 shadow-lg"
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                }
                hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 active:scale-95 border border-purple-400/30`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Number + Checkbox Grid */}
          <div className="grid grid-cols-3 gap-1 mb-4 mt-5">
            {range(0, 9).map((row) =>
              allNumbers.map((colArray, colIdx) => {
                const num = colArray[row];
                const color = numberBoxColors[row % numberBoxColors.length];
                return (
                  <div
                  
                    key={num}
                    className={`relative flex items-center gap-1 px-2 py-1 ${color} hover:scale-105 transition-all duration-200 cursor-pointer`}
                    style={{
                      border: "2px solid #fff",
                      borderRadius: "12px",
                      margin: "0",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    }}
                    onClick={() => toggle(row, colIdx)}
                  >
                    {/* Custom Checkbox */}
                    <input
                      type="checkbox"
                      checked={selected[row][colIdx]}
                      onChange={() => toggle(row, colIdx, true)}
                      className="peer appearance-none w-6 h-6 rounded bg-white border-2 border-[#4A314D]
    checked:bg-gradient-to-r checked:from-purple-600 checked:to-pink-600 checked:border-purple-600
    hover:scale-110 transition-all duration-200"
                    />
                    {/* Enhanced Checkmark */}
                    <span
                      className={`absolute left-3 top-3 text-white text-sm font-bold pointer-events-none transition-all duration-200 ${
                        selected[row][colIdx]
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-50"
                      }`}
                    >
                      ✓
                    </span>
                    {/* Enhanced Number Box */}
                    <span
                      className="w-10 h-7 flex items-center justify-center font-bold text-md text-[#4A314D] bg-white border-2 border-[#4A314D] rounded select-none transition-all duration-200 hover:bg-gray-50"
                      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                    >
                      {num}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg hover:shadow-purple-500/25 hover:from-purple-500 hover:to-blue-400 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handlePrint}
              disabled={!canPrint}
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
            <button
              onClick={resetCheckboxes}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 shadow-lg hover:shadow-pink-500/25 hover:from-pink-400 hover:to-red-400 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Reset (F10)
            </button>
          </div>
        </div>

        {/* Main Table (unchanged from before) */}
        <div className="flex-1 bg-gradient-to-b from-slate-800/70 to-slate-900/90 rounded-2xl shadow-2xl border-2 border-slate-700/50 transparent-scrollbar p-4 overflow-hidden backdrop-blur-sm">
          {/* Enhanced Table */}
          <div className="overflow-x-auto transparent-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {/* Row header blank */}
                  <th className="bg-transparent p-0"></th>
                  {/* 10 col headers */}
                  {range(0, 9).map((n) => (
                    <th
                      key={n}
                      className="p-2 text-center text-sm font-bold text-purple-300 bg-slate-800/30 border-r border-slate-700/30 last:border-r-0"
                    >
                      {/* Blank for column headers */}
                    </th>
                  ))}
                  {/* Spacer, Quantity, Points headers */}
                  <th className="bg-transparent p-2"></th>
                  <th className="bg-transparent p-2"></th>
                </tr>
              </thead>
              <tbody>
                {/* Column Header Input Row */}
                <tr>
                  <td className="bg-transparent"></td>
                  {range(0, 9).map((col) => (
                    <td
                      key={`col-header-${col}`}
                      className="p-1 text-center border-r border-slate-700/20 last:border-r-0"
                    >
                      <input
                        type="text"
                        className="w-12 h-6 rounded bg-cyan-900/80 text-cyan-200 border-2 border-cyan-400/40 text-center font-bold shadow focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200 hover:border-cyan-300"
                        maxLength={2}
                        value={columnHeaders[col]}
                        onChange={(e) =>
                          handleColumnHeaderChange(col, e.target.value)
                        }
                      />
                    </td>
                  ))}
                  <td className="bg-transparent"></td>
                  <td className="p-1 text-center font-bold text-yellow-400">
                    Quantity
                  </td>
                  <td className="p-1 text-center font-bold text-pink-400">
                    Amounts
                  </td>
                </tr>
                {/* Main Grid Rows */}
                {range(0, 9).map((row) => (
                  <tr
                    key={row}
                    className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-1 text-center border-r border-slate-700/20">
                      <div className="text-xs text-white font-bold py-2"></div>
                      <input
                        type="text"
                        className="w-12 h-6 rounded bg-lime-900/80 text-lime-200 border-2 border-lime-400/40 text-center font-bold shadow focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 outline-none transition-all duration-200 hover:border-lime-300"
                        maxLength={2}
                        value={rowHeaders[row]}
                        onChange={(e) =>
                          handleRowHeaderChange(row, e.target.value)
                        }
                      />
                    </td>

                    {/* main input box */}
                    {range(0, 9).map((col) => (
                      <td
                        key={col}
                        className="p-1 text-center border-r border-slate-700/20 last:border-r-0"
                      >
                        <div className="text-[11px] text-white font-bold">
                          {String(row * 10 + col).padStart(2, "0")}
                        </div>
                        <input
                          type="text"
                          className={`w-12 h-6 rounded-sm bg-slate-900/90 text-white border-2 border-purple-600/40 text-center font-bold shadow-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all duration-200 hover:border-purple-400
      ${
        isFPMode &&
        activeFPSetIndex !== null &&
        FP_SETS[activeFPSetIndex].includes(
          String(row * 10 + col).padStart(2, "0")
        )
          ? "bg-green-600/80 border-green-300 ring-2 ring-green-300"
          : ""
      }
      ${
        (activeTypeFilter === "even" && (row * 10 + col) % 2 !== 0) ||
        (activeTypeFilter === "odd" && (row * 10 + col) % 2 === 0)
          ? "opacity-50 cursor-not-allowed"
          : ""
      }
    `}
                          maxLength={2}
                          value={getCellValue(row, col)}
                          onChange={(e) => {
                            const num = row * 10 + col;
                            const isEven = num % 2 === 0;
                            const isOdd = !isEven;

                            if (
                              (activeTypeFilter === "even" && isOdd) ||
                              (activeTypeFilter === "odd" && isEven)
                            ) {
                              return; // Block input
                            }

                            handleGridChange(row, col, e.target.value);
                          }}
                          readOnly={
                            (activeTypeFilter === "even" &&
                              (row * 10 + col) % 2 !== 0) ||
                            (activeTypeFilter === "odd" &&
                              (row * 10 + col) % 2 === 0)
                          }
                          onClick={() => {
                            if (isFPMode) {
                              const numStr = String(row * 10 + col).padStart(
                                2,
                                "0"
                              );
                              const setIdx = getFPSetIndexForNumber(numStr);
                              setActiveFPSetIndex(
                                setIdx !== -1 ? setIdx : null
                              );
                            }
                          }}
                        />
                      </td>
                    ))}
                    <td className="bg-transparent"></td>
                    <td className="p-1 text-center">
                      <div className="w-16 h-8 rounded-lg bg-gradient-to-r from-yellow-200 to-yellow-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-yellow-400">
                        {quantities[row]}
                      </div>
                    </td>

                    <td className="p-1 text-center">
                      <div className="w-16 h-8 rounded-lg bg-gradient-to-r from-pink-200 to-pink-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-pink-400">
                        {points[row]}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-slate-800/40 border-t-2 border-purple-500/50">
                  <td
                    colSpan={10 + 2}
                    className="p-1 text-center font-bold text-purple-300"
                  >
                    TOTALS
                  </td>
                  <td className="p-1 text-center">
                    <div className="font-extrabold text-lg text-yellow-400 bg-slate-900/50 px-3 py-2 rounded-lg border border-yellow-500/50">
                      {totalUpdatedQuantity}
                    </div>
                  </td>
                  <td className="p-1 text-center">
                    <div className="font-extrabold text-lg text-pink-400 bg-slate-900/50 px-3 py-2 rounded-lg border border-pink-500/50">
                      {totalUpdatedPoints}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Enhanced Footer */}
          <div className="flex items-center mt-6 gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Transaction No/Bar Code"
                className="w-full py-3 px-5 rounded-xl bg-slate-700/90 text-white font-semibold placeholder-purple-300 border-2 border-purple-500/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 outline-none shadow-lg transition-all duration-200 hover:border-purple-400"
              />
            </div>
            <div className="flex-none">
              <button
                className="flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300 text-lg hover:scale-105 active:scale-95 hover:shadow-purple-500/25"
                onClick={() => setAdvanceModalOpen(true)}
              >
                <Zap className="w-5 h-5" />
                Advance Draw
              </button>
            </div>
          </div>
        </div>
      </div>

      <AdvanceDrawModal
        open={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        selectedTimes={advanceDrawTimes}
        setSelectedTimes={setAdvanceDrawTimes}
        onConfirm={(selected) => setAdvanceDrawTimes(selected)}
      />

      <div>
        <Navbar />
      </div>
    </div>
  );
}
