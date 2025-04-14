import React, { useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ScheduleSelector = ({
  scheduleType,
  setScheduleType,
  scheduleDate,
  setScheduleDate,
  scheduleDay,
  setScheduleDay,
  scheduleMonthDay,
  setScheduleMonthDay
}) => {
  // Set current time as default whenever schedule type changes
  useEffect(() => {
    if (scheduleType !== "manual") {
      setScheduleDate(new Date());
    }
  }, [scheduleType, setScheduleDate]);

  // Set the default day to current day of week when switching to weekly
  useEffect(() => {
    if (scheduleType === "weekly") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const today = days[new Date().getDay()];
      setScheduleDay(today);
    }
  }, [scheduleType, setScheduleDay]);

  // Set the default day to current day of month when switching to monthly
  useEffect(() => {
    if (scheduleType === "monthly") {
      const today = new Date().getDate();
      setScheduleMonthDay(today);
    }
  }, [scheduleType, setScheduleMonthDay]);

  return (
    <div className="schedule-selector">
      <div className="schedule-type-container">
        <label>Schedule Type:</label>
        <select
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value)}
          className="schedule-select form-select"
        >
          <option value="manual">Manual</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {scheduleType === "weekly" && (
        <div className="schedule-day-container">
          <label>Day of Week:</label>
          <select
            value={scheduleDay}
            onChange={(e) => setScheduleDay(e.target.value)}
            className="schedule-select form-select"
          >
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      )}

      {scheduleType === "monthly" && (
        <div className="schedule-month-day-container">
          <label>Day of Month:</label>
          <select
            value={scheduleMonthDay}
            onChange={(e) => setScheduleMonthDay(parseInt(e.target.value))}
            className="schedule-select form-select"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>Day {day}</option>
            ))}
          </select>
        </div>
      )}

      {scheduleType !== "manual" && (
        <div className="schedule-time-container">
          <label>Time of Day:</label>
          <DatePicker
            selected={scheduleDate}
            onChange={(date) => setScheduleDate(date)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="h:mm aa"
            className="schedule-time-picker form-input"
          />
        </div>
      )}
    </div>
  );
};

export default ScheduleSelector;