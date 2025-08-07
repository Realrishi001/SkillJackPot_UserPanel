
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

export default function Page() {
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
  const [activeFilter, setActiveFilter] = useState(null);

  const [activeTypeFilter, setActiveTypeFilter] = useState("all"); // 'all', 'odd', 'even', 'fp', or null
  const [activeColFilter, setActiveColFilter] = useState(null); // '10-19', '30-39', '50-59', or null

  // Constant Quantity and Points for demo (change values as needed)
  const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [points, setPoints] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // Initial points for each row
  const totalQuantity = quantities.reduce((a, b) => a + b, 0);
  const totalPoints = points.reduce((a, b) => a + b, 0);
  const [isFPMode, setIsFPMode] = useState(false);
  const [activeFPSetIndex, setActiveFPSetIndex] = useState(null);
  const [currentDrawSlot, setCurrentDrawSlot] = useState(() =>
    getNextDrawSlot(DRAW_TIMES)
  );
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceDrawTimes, setAdvanceDrawTimes] = useState([]);

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
  const [isPrinting, setIsPrinting] = useState(false);

  const [transactionInput, setTransactionInput] = useState("");
  const [activeFButtons, setActiveFButtons] = useState([]); // Example: ["10-19", "30-39"]

  const [allFColumnsSelected, setAllFColumnsSelected] = useState(false);
  const [activeNumberBox, setActiveNumberBox] = useState({
    row: null,
    col: null,
  });

  const [activeCheckbox, setActiveCheckbox] = useState(null);
  const [checkboxInputs, setCheckboxInputs] = useState({});
  const [activeColGroup, setActiveColGroup] = useState(null);

  // Calculates row-wise quantity and points for all checked numbers (checkboxInputs)
  const updatedQuantity = range(0, 9).map((row) => {
    let total = 0;

    for (let col = 0; col < 3; col++) {
      if (selected[row][col]) {
        const num = allNumbers[col][row];

        for (let gridCol = 0; gridCol < 10; gridCol++) {
          for (let gridRow = 0; gridRow < 10; gridRow++) {
            const cellIndex = gridRow * 10 + gridCol;
            const key = `${gridRow}-${gridCol}`;
            let cellValue = "";

            if (cellOverrides[key] !== undefined && cellOverrides[key] !== "") {
              cellValue = cellOverrides[key];
            } else if (checkboxInputs[num] && checkboxInputs[num][cellIndex]) {
              cellValue = checkboxInputs[num][cellIndex];
            } else {
              const rowVal = parseInt(rowHeaders[gridRow] || "0", 10);
              const colVal = parseInt(columnHeaders[gridCol] || "0", 10);
              if (rowHeaders[gridRow] && columnHeaders[gridCol]) {
                cellValue = (rowVal + colVal).toString();
              } else if (rowHeaders[gridRow]) {
                cellValue = rowVal.toString();
              } else if (columnHeaders[gridCol]) {
                cellValue = colVal.toString();
              }
            }

            const numValue = parseInt(cellValue, 10);
            if (!isNaN(numValue) && numValue > 0) {
              total += numValue;
            }
          }
        }
      }
    }

    return total;
  });

  // Amounts: Change formula if you want, right now just double of quantity
  const updatedPoints = updatedQuantity.map((q) => q * 2);

  function toggleNumberBox(row, col) {
    setActiveNumberBox({ row, col });
  }

  // SAVE on every change
  useEffect(() => {
    localStorage.setItem("checkboxInputs", JSON.stringify(checkboxInputs));
  }, [checkboxInputs]);

  // LOAD on mount
  useEffect(() => {
    const savedInputs = localStorage.getItem("checkboxInputs");
    if (savedInputs) {
      setCheckboxInputs(JSON.parse(savedInputs));
    }
  }, []);

  function selectByTypeFilter(type) {
    // type: "all" | "odd" | "even"
    setSelected((prev) => {
      return prev.map((rowArr, row) =>
        rowArr.map((_, col) => {
          const num = allNumbers[col][row];
          if (type === "all") return true;
          if (type === "odd") return num % 2 === 1;
          if (type === "even") return num % 2 === 0;
          return false;
        })
      );
    });
    setActiveCheckbox(null);
    setActiveColGroup(null);
  }

  function selectAllInColumn(colIdx) {
    setSelected((prev) => {
      const updated = prev.map((rowArr) =>
        rowArr.map((checked, cIdx) => (cIdx === colIdx ? true : checked))
      );

      // Update quantities and points based on new selection
      const newQuantities = updated.map((row) => row.filter(Boolean).length);
      const newPoints = newQuantities.map((q) => q * 2);

      setQuantities(newQuantities);
      setPoints(newPoints);

      return updated;
    });
  }
  function clearFPHighlights() {
    // Remove highlight class from all cells
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const numStr = String(row * 10 + col).padStart(2, "0");
        // You can use refs or direct DOM manipulation here
        const element = document.querySelector(`[data-index="${numStr}"]`);
        if (element) {
          element.classList.remove("fp-highlight");
        }
      }
    }
  }

  function highlightFPSet(setIndex) {
    // First clear any existing highlights
    clearFPHighlights();

    if (setIndex === -1 || setIndex === null) return;

    // Highlight all cells in the FP set
    FP_SETS[setIndex].forEach((numStr) => {
      const element = document.querySelector(`[data-index="${numStr}"]`);
      if (element) {
        element.classList.add("fp-highlight");
      }
    });
  }

  const handleClaimTicket = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/save-claimed-ticket`,
        { ticketId: transactionInput.trim() }
      );
      if (res.data.status === "success") {
        alert(
          "Claimed Successfully!\n" +
            JSON.stringify(res.data.claimedTicket, null, 2)
        );
      } else {
        alert(res.data.message || "Not a winning ticket");
      }
    } catch (err) {
      alert(
        "Error claiming ticket: " + (err?.response?.data?.error || err.message)
      );
    }
  };

  const colKeyToIndex = { "10-19": 0, "30-39": 1, "50-59": 2 };

  function handleColButton(colKey) {
    const colIndex = colKeyToIndex[colKey];

    // If already active, deselect this column only
    if (activeFButtons.includes(colKey)) {
      setActiveFButtons((prev) => prev.filter((k) => k !== colKey));
      setSelected((prev) =>
        prev.map((row) =>
          row.map((val, idx) => (idx === colIndex ? false : val))
        )
      );
      return;
    }

    // Else: select this column + add to activeFButtons
    setActiveFButtons((prev) => [...prev, colKey]);
    setSelected((prev) =>
      prev.map((row, rowIndex) =>
        row.map((val, idx) => (idx === colIndex ? true : val))
      )
    );

    setActiveColGroup(colKey);
    setActiveCheckbox(null);
  }

  // Handlers:
  // Update your handleColumnHeaderChange function:
  const handleColumnHeaderChange = (col, value) => {
    // Allow numbers from 0 to 999
    if (!/^\d{0,3}$/.test(value) || parseInt(value || "0", 10) > 999) return;

    setColumnHeaders((headers) =>
      headers.map((v, i) => (i === col ? value : v))
    );

    setCellOverrides((overrides) => {
      const updated = { ...overrides };

      for (let row = 0; row < 10; row++) {
        const key = `${row}-${col}`;

        const rowVal = parseInt(rowHeaders[row] || "0", 10);
        const colVal = parseInt(value || "0", 10);

        if (value === "") {
          delete updated[key];
        } else {
          // ✅ NEW: Force overwrite in every case (your final ask)
          if (rowHeaders[row] && rowHeaders[row] !== "") {
            updated[key] = (rowVal + colVal).toString();
          } else {
            updated[key] = value;
          }
        }
      }

      return updated;
    });
  };

  // Update your handleRowHeaderChange function:
  const handleRowHeaderChange = (row, value) => {
    // Allow numbers from 0 to 999
    if (!/^\d{0,3}$/.test(value) || parseInt(value || "0", 10) > 999) return;

    setRowHeaders((headers) => headers.map((v, i) => (i === row ? value : v)));

    setCellOverrides((overrides) => {
      const updated = { ...overrides };

      for (let col = 0; col < 10; col++) {
        const key = `${row}-${col}`;

        const rowVal = parseInt(value || "0", 10);
        const colVal = parseInt(columnHeaders[col] || "0", 10);

        if (value === "") {
          delete updated[key];
        } else {
          // ✅ NEW: Force overwrite in every case
          if (columnHeaders[col] && columnHeaders[col] !== "") {
            updated[key] = (rowVal + colVal).toString();
          } else {
            updated[key] = value;
          }
        }
      }

      return updated;
    });
  };

  // --- Timer logic ---
  const [remainSecs, setRemainSecs] = useState(() => getRemainTime());
  const timerRef = useRef();

  useEffect(() => {
    setRemainSecs(getRemainTime()); // Set initial value
    timerRef.current = setInterval(() => {
      setRemainSecs(getRemainTime());
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);
  useEffect(() => {
    const newQuantities = selected.map((row) => row.filter(Boolean).length);
    const newPoints = newQuantities.map((q) => q * 2);
    setQuantities(newQuantities);
    setPoints(newPoints);
  }, [selected]);

  useEffect(() => {
    if (remainSecs === 0) {
      setCurrentDrawSlot(getNextDrawSlot(DRAW_TIMES)); // Just update the slot
    }
  }, [remainSecs]);

  useEffect(() => {
    const ticketList = getTicketList();
    console.log("Selected Ticket Numbers:", ticketList);
    localStorage.setItem("ticketList", JSON.stringify(ticketList)); // optional
  }, [selected, checkboxInputs]);

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

  const drawTimeObj = new Date(Date.now() + remainSecs * 1000);
  const drawTime = drawTimeObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const drawDate = getTodayDateString();

  // --- Checkboxes --- //
  const toggle = (row, col) => {
    setSelected((prev) => {
      const copy = prev.map((arr) => arr.slice());
      copy[row][col] = !copy[row][col]; // Toggle the checkbox

      // Update quantity for that row
      setQuantities((prevQuantities) => {
        const updatedQuantities = [...prevQuantities];

        // Count how many checkboxes are selected in the row
        const selectedCount = copy[row].filter((selected) => selected).length;

        // Set quantity as the number of selected checkboxes in the row
        updatedQuantities[row] = selectedCount; // Quantity = number of selected checkboxes

        // Update points for that row based on quantity
        setPoints((prevPoints) => {
          const updatedPoints = [...prevPoints];
          updatedPoints[row] = updatedQuantities[row] * 2; // Points = quantity * 2
          return updatedPoints;
        });

        return updatedQuantities;
      });

      return copy;
    });
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "F10") {
        e.preventDefault();
        window.location.reload();
      }
      if (e.key === "F7") {
        e.preventDefault();
        selectAllInColumn(0); // 10-19
      }
      if (e.key === "F8") {
        e.preventDefault();
        selectAllInColumn(1); // 30-39
      }
      if (e.key === "F9") {
        e.preventDefault();
        selectAllInColumn(2); // 50-59
      }
      if (e.key === "F6") {
        e.preventDefault();
        if (!isPrinting) handlePrint();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [activeFilter]);

  // --- Column/Range Filters for F7/F8/F9 --- //
  const handleFilter = (colKey) => {
    setActiveColFilter(colKey);
    applyFilter(activeTypeFilter, colKey); // This is fine!
  };

  function handleOddEvenFP(type) {
    if (activeTypeFilter === type) {
      setActiveTypeFilter(null);
      resetCheckboxes(); // optional
      return;
    }

    setActiveTypeFilter(type);

    // Apply only matching numbers
    applyFilter(type, null); // null means apply across all columns
  }

  const resetCheckboxes = () => {
    setSelected(
      Array(10)
        .fill(null)
        .map(() => Array(3).fill(false))
    );
    setQuantities(Array(10).fill(0)); // Reset quantities
    setPoints(Array(10).fill(0)); // Reset points
    setActiveTypeFilter(null);
    setActiveColFilter(null);
    setCellOverrides({});
    setColumnHeaders(Array(10).fill(""));
    setRowHeaders(Array(10).fill(""));
  };

  useEffect(() => {
    // 1. Quantities per row
    console.log("Quantities per row:", quantities);

    // 2. Sum of all input values (totalValue)
    let totalValue = 0;
    Object.values(cellOverrides).forEach((v) => {
      const num = parseInt(v, 10);
      if (!isNaN(num)) totalValue += num;
    });
    console.log("Total value:", totalValue);

    // 3. Updated quantity column: [totalValue * q for each q in quantities]
    const updatedQuantity = quantities.map((q) => totalValue * q);
    console.log("Updated quantity:", updatedQuantity);
  }, [quantities, cellOverrides]);

  useEffect(() => {
    // Instead of the filledCells + selectedNumbers approach,
    // build tickets from checkboxInputs for each selected number

    let ticketList = [];
    let selectedNumbers = [];
    for (let colIdx = 0; colIdx < allNumbers.length; colIdx++) {
      for (let rowIdx = 0; rowIdx < allNumbers[colIdx].length; rowIdx++) {
        if (selected[rowIdx][colIdx]) {
          const num = allNumbers[colIdx][rowIdx];
          selectedNumbers.push(num);

          // If this number has any entered values (in checkboxInputs)
          if (checkboxInputs[num]) {
            Object.entries(checkboxInputs[num]).forEach(
              ([cellIndex, value]) => {
                if (value && value !== "0" && value !== "") {
                  ticketList.push(`${num}-${cellIndex} : ${value}`);
                }
              }
            );
          }
        }
      }
    }
    console.log("Selected Ticket Numbers:", ticketList);

    // 2. Get all input cells with values
    let filledCells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const key = `${row}-${col}`;
        const value = cellOverrides[key];
        if (value && value !== "") {
          // This is the fix:
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

    // Log to console
    console.log("Selected Ticket Numbers:", ticketList);

    // Save to localStorage
    localStorage.setItem("ticketList", JSON.stringify(ticketList));
  }, [selected, cellOverrides]);

  const handleGridChange = (row, col, value) => {
    if (!/^\d*$/.test(value)) return;

    const numStr = String(row * 10 + col).padStart(2, "0");

    if (
      isFPMode &&
      activeFPSetIndex !== null &&
      FP_SETS[activeFPSetIndex].includes(numStr)
    ) {
      // Update all cells in the active FP set
      setCellOverrides((overrides) => {
        const updated = { ...overrides };
        FP_SETS[activeFPSetIndex].forEach((setNum) => {
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
              if (String(r * 10 + c).padStart(2, "0") === setNum) {
                updated[`${r}-${c}`] = value;
              }
            }
          }
        });
        return updated;
      });
    } else {
      setCellOverrides((prev) => {
        const updated = { ...prev };
        if (value === "") {
          delete updated[`${row}-${col}`];
        } else {
          updated[`${row}-${col}`] = value;
        }
        return updated;
      });
    }
  };

  function getTicketList() {
    const ticketSet = new Set();
    const selectedNumbers = [];

    for (let colIdx = 0; colIdx < allNumbers.length; colIdx++) {
      for (let rowIdx = 0; rowIdx < allNumbers[colIdx].length; rowIdx++) {
        if (selected[rowIdx][colIdx]) {
          const num = allNumbers[colIdx][rowIdx];
          selectedNumbers.push(num);

          // 1. CheckboxInputs (specific to this number)
          if (checkboxInputs[num]) {
            Object.entries(checkboxInputs[num]).forEach(
              ([cellIndex, value]) => {
                if (value && value !== "0" && value !== "") {
                  ticketSet.add(
                    `${num}-${cellIndex.padStart(2, "0")} : ${value}`
                  );
                }
              }
            );
          }
        }
      }
    }

    // 2. Manual + Header overrides (for every selected number)
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const key = `${row}-${col}`;
        const value = getCellValue(row, col);
        const cellIndex = String(row * 10 + col).padStart(2, "0");

        if (value && value !== "0" && value !== "") {
          selectedNumbers.forEach((num) => {
            ticketSet.add(`${num}-${cellIndex} : ${value}`);
          });
        }
      }
    }

    return Array.from(ticketSet);
  }

  // Replace your getCellValue function with this corrected version:
  function getCellValue(row, col) {
    const key = `${row}-${col}`;
    const cellIndex = row * 10 + col;
    if (cellOverrides[key] === "__cleared__") return "";
    // Priority 1: Direct manual override (highest priority)
    if (cellOverrides[key] !== undefined && cellOverrides[key] !== "") {
      return cellOverrides[key];
    }

    // Priority 2: Row/Column header values (this should come BEFORE checkbox logic)
    const rowVal = parseInt(rowHeaders[row] || "0", 10);
    const colVal = parseInt(columnHeaders[col] || "0", 10);

    if (
      rowHeaders[row] &&
      rowHeaders[row] !== "" &&
      columnHeaders[col] &&
      columnHeaders[col] !== ""
    ) {
      return (rowVal + colVal).toString();
    } else if (columnHeaders[col] && columnHeaders[col] !== "") {
      return columnHeaders[col];
    } else if (rowHeaders[row] && rowHeaders[row] !== "") {
      return rowHeaders[row];
    }

    // Priority 3: Active checkbox values
    if (activeCheckbox && checkboxInputs[activeCheckbox]) {
      const value = checkboxInputs[activeCheckbox][cellIndex];
      if (value !== undefined && value !== "") {
        return value;
      }
    }

    // Priority 4: Active column group values
    if (activeColGroup) {
      let colIdx;
      if (activeColGroup === "10-19") colIdx = 0;
      else if (activeColGroup === "30-39") colIdx = 1;
      else if (activeColGroup === "50-59") colIdx = 2;

      if (colIdx !== undefined) {
        const nums = allNumbers[colIdx];
        for (let num of nums) {
          if (checkboxInputs[num] && checkboxInputs[num][cellIndex]) {
            return checkboxInputs[num][cellIndex];
          }
        }
      }
    }

    return "";
  }

  function getFPSetIndexForNumber(numStr) {
    return FP_SETS.findIndex((set) => set.includes(numStr));
  }

  function applyFilter(type, colKey) {
    const colIndexes = { "10-19": 0, "30-39": 1, "50-59": 2 };
    const newSelected = Array(10)
      .fill(null)
      .map(() => Array(3).fill(false));

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 3; col++) {
        const num = allNumbers[col][row];
        let matchType = false;

        if (!type || type === "all") matchType = true;
        else if (type === "even") matchType = isEven(num);
        else if (type === "odd") matchType = isOdd(num);
        else if (type === "fp") matchType = isPrime(num);

        let matchCol = !colKey || col === colIndexes[colKey];

        if (matchType && matchCol) newSelected[row][col] = true;
      }
    }
    setSelected(newSelected);

    // ----------- ADD THIS PART BELOW -----------
    // recalculate quantities and points based on newSelected
    const updatedQuantities = newSelected.map(
      (rowArr) => rowArr.filter(Boolean).length
    );
    setQuantities(updatedQuantities);
    setPoints(updatedQuantities.map((q) => q * 2)); // assuming points = quantity * 2
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
    if (printWindow) {
      printWindow.onload = function () {
        printWindow.print();
      };
    } else {
      alert(
        "Unable to open print window. Please disable popup blocker and try again."
      );
    }

    // Alternative: Save as file
    // pdf.save(`receipt_${ticketId}.pdf`);
  };

  // to print and save the data
  const handlePrint = async () => {
    console.log("PRINT CLICKED");
    if (isPrinting) return; // Don't allow double fire
    setIsPrinting(true);

    try {
      const ticketList = getTicketList();
      if (remainSecs <= 30) {
        alert("Print is disabled during the last 30 seconds before draw time!");
        return;
      }
      if (totalUpdatedQuantity === 0) {
        alert("No quantity selected or no tickets to print.");
        return;
      }

      // Get loginId from JWT
      const loginId = getLoginIdFromToken();
      if (!loginId) {
        alert("User not logged in.");
        return;
      }

      // Get current date and time (formatted)
      const gameTime = getFormattedDateTime();

      // Prepare data payload
      const payload = {
        gameTime,
        ticketNumber: ticketList.join(", "),
        totalQuatity: totalUpdatedQuantity,
        totalPoints: totalUpdatedPoints,
        loginId,
        drawTime:
          advanceDrawTimes.length > 0 ? advanceDrawTimes : [currentDrawSlot],
      };

      // Send data to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/saveTicket`,
        payload
      );

      if (response.status === 201) {
        // Get ticket ID from response
        const ticketId =
          response.data.ticketId || response.data.id || Date.now().toString();

        alert("Tickets saved successfully!");

        // Generate and print the receipt with dynamic ticket ID
        generatePrintReceipt(
          {
            gameTime: gameTime,
            drawTime:
              advanceDrawTimes.length > 0
                ? advanceDrawTimes
                : [currentDrawSlot],
            loginId: loginId,
            ticketNumber: ticketList.join(", "),
            totalQuatity: totalUpdatedQuantity,
            totalPoints: totalUpdatedPoints,
          },
          ticketId
        );

        // Clear the form after printing
        resetCheckboxes();
        setCellOverrides({});
        setColumnHeaders(Array(10).fill(""));
        setRowHeaders(Array(10).fill(""));
        setCheckboxInputs({});
        localStorage.removeItem("checkboxInputs");
        setAdvanceDrawTimes([]);
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
    } finally {
      setIsPrinting(false); // Reset the printing state
    }
  };
  // Calculate total value (sum of all input boxes)
  let totalValue = 0;
  Object.values(cellOverrides).forEach((v) => {
    const num = parseInt(v, 10);
    if (!isNaN(num)) totalValue += num;
  });

  // Calculate updatedQuantity array
  // const updatedQuantity = quantities.map((q) => totalValue * q);

  // const updatedPoints = updatedQuantity.map((q) => q * 2);

  const totalUpdatedQuantity = updatedQuantity.reduce(
    (sum, val) => sum + val,
    0
  );
  const totalUpdatedPoints = updatedPoints.reduce((sum, val) => sum + val, 0);

  // Sum of values in a row
  function getRowSum(row) {
    let sum = 0;
    for (let col = 0; col < 10; col++) {
      const key = `${row}-${col}`;
      const val = parseInt(cellOverrides[key], 10);
      if (!isNaN(val)) sum += val;
    }
    return sum;
  }

  const isOddIndex = (row, col) => (row * 10 + col) % 2 === 1;
  const isEvenIndex = (row, col) => (row * 10 + col) % 2 === 0;

  useEffect(() => {
    console.log("activeTypeFilter:", activeTypeFilter);
    console.log(
      "activeCheckbox:",
      activeCheckbox,
      "activeColGroup:",
      activeColGroup
    );
  }, [activeTypeFilter, activeCheckbox, activeColGroup]);

  function isCellDisabled(row, col) {
    if (isFPMode) return false;
    if (activeTypeFilter === "odd") return !isOddIndex(row, col);
    if (activeTypeFilter === "even") return !isEvenIndex(row, col);
    if (activeTypeFilter === "all") return false;
    return !activeCheckbox && !activeColGroup;
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
            onClick={() => {
              if (activeTypeFilter === "all") {
                setActiveTypeFilter(null);
                setActiveCheckbox(null);
                setActiveColGroup(null);
              } else {
                setActiveTypeFilter("all");
                setActiveCheckbox(null);
                setActiveColGroup(null);
                 selectByTypeFilter("all");
              }
            }}
            className={`px-4 py-2.5 rounded font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeTypeFilter === "all"
                ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
            }`}
          > 
            All
          </button>
          <button
            onClick={() => {
              if (activeTypeFilter === "even") {
                setActiveTypeFilter(null);
                setActiveCheckbox(null);
                setActiveColGroup(null);
              } else {
                setActiveTypeFilter("even");
                setActiveCheckbox(null);
                setActiveColGroup(null);
              }
            }}
            className={`px-5 py-2.5 rounded font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeTypeFilter === "even"
                ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
            }`}
          >
            Even
          </button>
          <button
            onClick={() => {
              if (activeTypeFilter === "odd") {
                setActiveTypeFilter(null);
                setActiveCheckbox(null);
                setActiveColGroup(null);
              } else {
                setActiveTypeFilter("odd");
                setActiveCheckbox(null);
                setActiveColGroup(null);
              }
            }}
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
              setIsFPMode(!isFPMode);
              if (isFPMode) {
                // If turning off FP mode, clear highlights
                clearFPHighlights();
                setActiveFPSetIndex(null);
              }
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
            {remainTime}
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
                onClick={() => handleColButton(tab.key)}
                className={`px-4 py-1 rounded font-bold text-md text-white
          ${
            activeFilter === tab.key
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
                  >
                    {/* Custom Checkbox */}
                    <input
                      type="checkbox"
                      checked={selected[row][colIdx]}
                      onChange={() => {
                        const checkboxNum = allNumbers[colIdx][row];
                        const isChecked = selected[row][colIdx];

                        toggle(row, colIdx);

                        if (!isChecked) {
                          // If we are checking (ticking) the box
                          setActiveCheckbox(checkboxNum);
                        } else {
                          // If we are unchecking, remove values for this number
                          setCheckboxInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[checkboxNum];
                            return updated;
                          });
                          if (activeCheckbox === checkboxNum) {
                            setActiveCheckbox(null);
                          }
                        }
                      }}
                      className="peer appearance-none w-6 h-6 rounded bg-white border-2 border-[#4A314D] checked:bg-gradient-to-r checked:from-purple-600 checked:to-pink-600 checked:border-purple-600 flex-shrink-0 transition-all duration-200 hover:scale-110"
                      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNumberBox(row, colIdx);
                        setActiveCheckbox(num);
                        setActiveColGroup(null);
                      }}
                      className={`w-10 h-7 flex items-center justify-center font-bold text-md border-2 border-[#4A314D] rounded select-none transition-all duration-200 cursor-pointer
                      ${
                        activeNumberBox.row === row &&
                        activeNumberBox.col === colIdx
                          ? "bg-purple-700 text-white"
                          : "bg-white text-[#4A314D]"
                      }
                    `}
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
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg hover:shadow-purple-500/25 hover:from-purple-500 hover:to-blue-400 transition-all duration-300 hover:scale-105 active:scale-95 ${
                !canPrint ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handlePrint}
              disabled={!canPrint || isPrinting}
            >
              <Printer className="w-5 h-5" />
              Print
            </button>

            <button
              onClick={() => {
                window.location.reload();
                setCheckboxInputs({});
                localStorage.removeItem("checkboxInputs");
              }}
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
                        className="w-16 h-6 rounded bg-cyan-900/80 text-cyan-200 border-2 border-cyan-400/40 text-center font-bold shadow focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200 hover:border-cyan-300"
                        maxLength={3}
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
                        className="w-16 h-6 rounded bg-lime-900/80 text-lime-200 border-2 border-lime-400/40 text-center font-bold shadow focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 outline-none transition-all duration-200 hover:border-lime-300"
                        maxLength={3}
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
                          data-index={String(row * 10 + col).padStart(2, "0")}
                          className={`
    w-14 h-6 rounded-sm bg-slate-900/90 text-white border-2 border-purple-600/40
    text-center font-bold shadow-lg focus:border-pink-500 focus:ring-2
    focus:ring-pink-500/20 outline-none transition-all duration-200
    hover:border-purple-400
    ${
      isFPMode &&
      activeFPSetIndex !== null &&
      FP_SETS[activeFPSetIndex].includes(
        String(row * 10 + col).padStart(2, "0")
      )
        ? "fp-highlight"
        : ""
    }
    ${
      (
        isFPMode
          ? false
          : activeTypeFilter === "odd"
          ? !isOddIndex(row, col)
          : activeTypeFilter === "even"
          ? !isEvenIndex(row, col)
          : // : activeTypeFilter === "all"
            false
      )
        ? // : (!activeCheckbox && !activeColGroup)
          "bg-gray-200 text-transparent cursor-not-allowed opacity-70"
        : ""
    }
  `}
                          maxLength={3}
                          value={getCellValue(row, col)}
                          onClick={(e) => {
                            if (isFPMode) {
                              const numStr = String(row * 10 + col).padStart(
                                2,
                                "0"
                              );
                              const setIdx = getFPSetIndexForNumber(numStr);

                              if (setIdx !== -1) {
                                setActiveFPSetIndex(setIdx);
                                highlightFPSet(setIdx);
                              } else {
                                setActiveFPSetIndex(null);
                                clearFPHighlights();
                              }
                            }
                          }}
                          onChange={(e) => {
                            const input = e.target.value;

                            if (!/^\d{0,3}$/.test(input)) return;

                            const inputIndex = `${row * 10 + col}`;
                            const numStr = String(row * 10 + col).padStart(
                              2,
                              "0"
                            );

                            // Marking cleared values specially so headers don't take over
                            const clearedValue = "__cleared__";

                            const updateOverride = (key, value) => {
                              setCellOverrides((prev) => {
                                const updated = { ...prev };
                                if (value === "") {
                                  updated[key] = clearedValue;
                                } else {
                                  updated[key] = value;
                                }
                                return updated;
                              });
                            };

                            if (
                              isFPMode &&
                              activeFPSetIndex !== null &&
                              FP_SETS[activeFPSetIndex].includes(numStr)
                            ) {
                              FP_SETS[activeFPSetIndex].forEach((setNum) => {
                                const r = Math.floor(parseInt(setNum) / 10);
                                const c = parseInt(setNum) % 10;
                                updateOverride(`${r}-${c}`, input);
                              });
                            } else if (activeColGroup) {
                              let colIdx;
                              if (activeColGroup === "10-19") colIdx = 0;
                              else if (activeColGroup === "30-39") colIdx = 1;
                              else if (activeColGroup === "50-59") colIdx = 2;

                              const nums = allNumbers[colIdx];
                              setCheckboxInputs((prev) => {
                                const updated = { ...prev };
                                nums.forEach((num) => {
                                  if (!updated[num]) updated[num] = {};
                                  updated[num][inputIndex] =
                                    input === "" ? clearedValue : input;
                                });
                                return updated;
                              });
                            } else if (activeCheckbox) {
                              setCheckboxInputs((prev) => {
                                const updated = { ...prev };
                                if (!updated[activeCheckbox])
                                  updated[activeCheckbox] = {};
                                updated[activeCheckbox][inputIndex] =
                                  input === "" ? clearedValue : input;
                                return updated;
                              });
                            } else {
                              updateOverride(`${row}-${col}`, input);
                            }
                          }}
                          disabled={
                            isFPMode
                              ? false
                              : activeTypeFilter === "odd"
                              ? !isOddIndex(row, col)
                              : activeTypeFilter === "even"
                              ? !isEvenIndex(row, col)
                              : activeTypeFilter === "all"
                              ? false
                              : !activeCheckbox && !activeColGroup
                          }
                        />
                      </td>
                    ))}
                    <td className="bg-transparent"></td>
                    <td className="p-1 text-center">
                      <div className="w-16 h-8 rounded-lg bg-gradient-to-r from-yellow-200 to-yellow-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-yellow-400">
                        {updatedQuantity[row]}
                      </div>
                    </td>

                    <td className="p-1 text-center">
                      <div className="w-16 h-8 rounded-lg bg-gradient-to-r from-pink-200 to-pink-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-pink-400">
                        {updatedPoints[row]}
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
                value={transactionInput}
                onChange={(e) => setTransactionInput(e.target.value)}
                className="w-full py-3 px-5 rounded-xl bg-slate-700/90 text-white font-semibold placeholder-purple-300 border-2 border-purple-500/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 outline-none shadow-lg transition-all duration-200 hover:border-purple-400"
              />
            </div>
            <div className="flex-none flex gap-2">
              <button
                className="flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-lime-500 shadow-xl hover:from-lime-500 hover:to-green-600 transition-all duration-300 text-lg hover:scale-105 active:scale-95 hover:shadow-green-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!transactionInput.trim()}
                onClick={handleClaimTicket}
              >
                <TrendingUp className="w-5 h-5" />
                Claim Ticket
              </button>

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
      <style jsx>{`
        .fp-highlight {
          background-color: rgba(34, 197, 94, 0.3) !important;
          border: 2px solid #22c55e !important;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5) !important;
        }
      `}</style>

      <div>
        <Navbar />
      </div>
    </div>
  );
} 