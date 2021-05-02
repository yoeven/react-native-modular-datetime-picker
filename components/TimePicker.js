import React, { useEffect, useState, useRef, memo } from "react";
import { View, FlatList } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import dayjs from "dayjs";
import TimeSelectionItem from "./TimeSelectionItem";

const empty = { value: "b", type: "empty", disabled: true };

const TimePicker = ({ dateValue, minDate, maxDate, onChange, blocks }) => {
  const blocksToCheck = blocks.filter((block) => block.hasOwnProperty("time"));
  const HoursFlatList = useRef(null);
  const MinsFlatList = useRef(null);
  const CycleFlatList = useRef(null);
  const [hourList, setHourList] = useState([]);
  const [minList, setMinList] = useState([]);
  const [cycleList, setCycleList] = useState([
    { value: "AM", type: "time", disabled: true },
    { value: "PM", type: "time", disabled: true },
  ]);
  const [byHourData, setByHourData] = useState(null);

  useEffect(() => {
    const result = processByHours(dateValue);
    setByHourData(result);
  }, []);

  useEffect(() => {
    if (!byHourData) return;
    onChangeCheck();
  }, [dayjs(dateValue).toISOString()]);

  useEffect(() => {
    if (!byHourData) return;
    getAllTimeValues();
  }, [byHourData, dayjs(dateValue).hour()]);

  const processByHours = (baseDate) => {
    const byHours = [...Array(24).keys()].map((item) => {
      const h = item;
      const checkHour = dayjs(baseDate).hour(h).minute(59).second(0);

      let oneMinEnabled = false;

      const byMinutes = [...Array(60).keys()].map((item) => {
        const checkMin = dayjs(checkHour).minute(item).second(0);

        const disabled = generateDisabled(checkMin);

        if (!disabled) oneMinEnabled = true;

        return {
          value: item,
          type: "time",
          disabled: disabled,
        };
      });

      const displayMinutes = byMinutes.map((item) => {
        const minValue = item.value;
        const valueStringFormat = minValue.toString().length == 1 ? "0" + minValue : minValue;

        return {
          ...item,
          value: valueStringFormat,
        };
      });

      return {
        value: h,
        type: "time",
        disabled: oneMinEnabled == false,
        minutes: byMinutes,
        displayMinutes: displayMinutes,
      };
    });

    return byHours;
  };

  const onChangeCheck = () => {
    let selectedTime = dayjs(dateValue);
    const hourData = byHourData[selectedTime.hour()];

    let newTime = null;
    if (hourData.disabled) {
      newTime = getNearestAvailable("cycle", selectedTime);
    } else if (hourData.minutes[selectedTime.minute()].disabled) {
      newTime = getNearestAvailable("min", selectedTime);
    }

    if (newTime != null) {
      console.log("fix date", newTime.format("LT"));
      onChange({ timeValue: newTime.toDate() });
      setTimeout(() => {
        resetTimeToCenter(newTime);
      }, 100);
      return;
    } else {
      setTimeout(() => {
        resetTimeToCenter(selectedTime);
      }, 100);
    }
  };

  const generateDisabled = (baseDate) => {
    const currentDate = dayjs(baseDate);

    if (minDate != null && currentDate.isBefore(minDate, "minute")) {
      return true;
    }

    if (maxDate != null && currentDate.isAfter(maxDate, "minute")) {
      return true;
    }

    for (const block of blocksToCheck) {
      const repeat = block.repeat;

      let timeCheckFrom = dayjs(block.time.from);
      let timeCheckTo = dayjs(block.time.to);

      let disabled = false;

      const checkValue = dayjs(timeCheckFrom);

      switch (block.type) {
        case "time":
          disabled = true;
          break;
        case "date":
          if (repeat) {
            if (checkValue.format("DDMM") == currentDate.format("DDMM")) disabled = true;
          } else {
            if (checkValue.isSame(currentDate, "date")) disabled = true;
          }
          break;
        case "week":
          if (currentDate.isSame(checkValue, "week")) {
            disabled = true;
          }
          break;
        case "weekday":
          if (currentDate.format("dddd") == checkValue.format("dddd")) disabled = true;
          break;
        case "month":
          if (repeat) {
            if (currentDate.format("MM") == checkValue.format("MM")) disabled = true;
          } else {
            if (currentDate.format("MMYYYY") == checkValue.format("MMYYYY")) disabled = true;
          }
          break;
        case "year":
          if (currentDate.isSame(checkValue, "year")) disabled = true;
          break;
      }

      if (disabled) {
        timeCheckFrom = timeCheckFrom.year(dayjs(currentDate).year()).dayOfYear(dayjs(currentDate).dayOfYear());
        timeCheckTo = timeCheckTo.year(dayjs(currentDate).year()).dayOfYear(dayjs(currentDate).dayOfYear());

        if (currentDate.isBetween(timeCheckFrom, timeCheckTo, "minute", "[]")) {
          return true;
        }
      }
    }

    return false;
  };

  const getAllTimeValues = () => {
    const [hour, min, cycle] = [getDataValues("hour"), getDataValues("min"), getDataValues("cycle")];

    setHourList([...hour]);
    setMinList([...min]);
    setCycleList([...cycle]);

    onChangeCheck();
  };

  const resetTimeToCenter = (time) => {
    const timeParsed = dayjs(time);

    try {
      const val = parseInt(timeParsed.format("h"));
      HoursFlatList.current.scrollToIndex({
        index: val == 12 ? 2 : val + 2,
        viewPosition: 0.5,
        animated: true,
      });
      MinsFlatList.current.scrollToIndex({
        index: parseInt(timeParsed.format("m")) + 2,
        viewPosition: 0.5,
        animated: true,
      });
      CycleFlatList.current.scrollToIndex({
        index: timeParsed.format("A") == "AM" ? 2 : 3,
        viewPosition: 0.5,
        animated: true,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getNearestAvailable = (type, value) => {
    const givenValue = dayjs(value);
    const currentDate = dayjs(dateValue).hour(givenValue.hour()).minute(givenValue.minute());

    switch (type) {
      case "hour":
        for (let i = 0; i < 24; i++) {
          if (!byHourData[i].disabled) {
            return getNearestAvailable("min", currentDate.hour(i).second(0));
          }
        }

        break;
      case "min":
        const hourSelected = currentDate.hour();

        const byMins = byHourData[hourSelected];
        for (let m = 0; m < 60; m++) {
          const byMinData = byMins.minutes[m];

          if (!byMinData.disabled) {
            return currentDate.hour(hourSelected).minute(byMinData.value).second(0);
          }
        }
        return getNearestAvailable("hour", value);
      case "cycle":
        if (currentDate.format("A") == "AM") {
          for (let i = 0; i < 12; i++) {
            if (!byHourData[i].disabled) {
              return getNearestAvailable("min", currentDate.hour(i).minute(0).second(0));
            }
          }
        } else {
          for (let i = 12; i < 24; i++) {
            if (!byHourData[i].disabled) {
              return getNearestAvailable("min", currentDate.hour(i).minute(0).second(0));
            }
          }
        }

        return getNearestAvailable("hour", value);
    }

    return null;
  };

  const onValueSelected = (type, value, index) => {
    const selectedTime = dateValue;

    let updatedTime = null;

    switch (type) {
      case "hour":
        const A = selectedTime.format("A");
        if (A == "AM") {
          updatedTime = dayjs(selectedTime).hour(value == 12 ? 0 : value);
        } else {
          updatedTime = dayjs(selectedTime).hour(value + 12 == 24 ? 12 : value + 12);
        }
        break;
      case "min":
        updatedTime = dayjs(selectedTime).minute(value);
        break;
      case "cycle":
        updatedTime = dayjs(selectedTime);
        if (updatedTime.format("A") == value) {
          updatedTime = dayjs(selectedTime);
        } else {
          if (value == "AM") {
            updatedTime = dayjs(selectedTime).subtract(12, "hour");
          } else {
            updatedTime = dayjs(selectedTime).add(12, "hour");
          }
        }

        break;
    }

    resetTimeToCenter(updatedTime);

    onChange({ timeValue: updatedTime != null ? updatedTime.toDate() : updatedTime });
  };

  const isSelected = (type, value) => {
    switch (type) {
      case "hour":
        return dateValue.format("h") == value;
      case "min":
        return dateValue.format("mm") == value;
      case "cycle":
        return dateValue.format("A") == value;
    }
  };

  const getDataValues = (type) => {
    let dataValues = [];

    const _byHourData = [...byHourData];

    switch (type) {
      case "hour":
        dataValues =
          dayjs(dateValue).format("A") == "AM"
            ? _byHourData.slice(0, 12).map((item) => {
                return {
                  ...item,
                  value: item.value == 0 ? "12" : item.value,
                };
              })
            : _byHourData.slice(12, 24).map((item) => {
                let newVal = item.value - 12;
                newVal = newVal == 0 ? "12" : newVal;

                return {
                  ...item,
                  value: newVal,
                };
              });
        break;
      case "min":
        dataValues = _byHourData[dayjs(dateValue).hour()].displayMinutes;
        break;
      case "cycle":
        dataValues = ["AM", "PM"].map((item) => {
          const t = item;
          let disabled =
            item == "AM"
              ? _byHourData.slice(0, 12).find((t) => t.disabled == false)
              : _byHourData.slice(12, 24).find((t) => t.disabled == false);

          return {
            value: t,
            type: "time",
            disabled: disabled != null ? false : true,
          };
        });
        break;
    }

    return [empty, empty, ...dataValues, empty, empty];
  };

  const getSelectonList = (type) => {
    let refSelector = null;
    let colIndex = 0;
    let listArray = [];

    switch (type) {
      case "hour":
        refSelector = HoursFlatList;
        colIndex = 1;
        listArray = hourList;
        break;
      case "min":
        refSelector = MinsFlatList;
        colIndex = 2;
        listArray = minList;
        break;
      case "cycle":
        refSelector = CycleFlatList;
        colIndex = 3;
        listArray = cycleList;
        break;
    }

    return (
      <FlatList
        ref={refSelector}
        style={{ marginRight: colIndex % 3 !== 0 ? wp(5) : 0, flex: 1 }}
        showsVerticalScrollIndicator={false}
        listKey={`selection_time_${type}`}
        data={listArray}
        keyExtractor={(item, index) => index.toString()}
        getItemLayout={(data, index) => ({ length: hp(5), offset: hp(5) * index, index })}
        renderItem={({ item, index }) => (
          <TimeSelectionItem
            index={index}
            item={item}
            onValueSelected={onValueSelected}
            type={type}
            isSelected={isSelected(type, item.value)}
          />
        )}
      />
    );
  };

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: hp(20) }}>
        {getSelectonList("hour")}
        {getSelectonList("min")}
        {getSelectonList("cycle")}
      </View>
    </View>
  );
};

TimePicker.defaultProps = {
  dateValue: new Date(),
  minDate: null,
  maxDate: null,
  onChange: () => {},
  blocks: [],
};

export default memo(TimePicker);
