import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, TouchableWithoutFeedback, FlatList, InteractionManager } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import dayjs from "dayjs";

const TimePicker = ({ dateValue, minDate, maxDate, onChange, blocks }) => {
  let interactionPromise = null;
  const HoursFlatList = useRef(null);
  const MinsFlatList = useRef(null);
  const CycleFlatList = useRef(null);
  const [hourList, setHourList] = useState([]);
  const [minList, setMinList] = useState([]);
  const [cycleList, setCycleList] = useState([]);
  const [disabledTimes, setDisabledTimes] = useState([]);

  useEffect(() => {
    generateDisabled();
  }, [dateValue]);

  useEffect(() => {
    onChangeCheck();

    return () => {
      interactionPromise != null && interactionPromise.cancel();
    };
  }, [disabledTimes]);

  const onChangeCheck = async () => {
    await getAllTimeValues();

    interactionPromise != null && interactionPromise.cancel();

    interactionPromise = InteractionManager.runAfterInteractions(() => {
      let selectedTime = dayjs(dateValue);

      if (isDisabled(selectedTime)) {
        selectedTime = getNearestAvailable("hour", selectedTime);

        if (selectedTime != null) {
          onChange({ timeValue: selectedTime.toDate() });
        }
      }

      resetTimeToCenter(selectedTime);
    });
  };

  const generateDisabled = () => {
    const blocksToCheck = blocks.filter((block) => block.hasOwnProperty("time"));

    const _disabledTimes = [];

    for (const block of blocksToCheck) {
      const repeat = block.repeat;

      let timeCheckFrom = dayjs(block.time.from);
      let timeCheckTo = dayjs(block.time.to);

      let disabled = false;

      let checkValue = dayjs(timeCheckFrom);
      let currentDate = dayjs(dateValue);

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
        timeCheckFrom = timeCheckFrom.year(dayjs(dateValue).year()).dayOfYear(dayjs(dateValue).dayOfYear());
        timeCheckTo = timeCheckTo.year(dayjs(dateValue).year()).dayOfYear(dayjs(dateValue).dayOfYear());

        let updatedTime = false;

        for (let i = 0; i < _disabledTimes.length; i++) {
          const disabledTime = _disabledTimes[i];
          const checkFrom = dayjs(disabledTime.from);
          const checkTo = dayjs(disabledTime.to);

          if (
            timeCheckFrom.isBetween(checkFrom, checkTo, null, "[]") &&
            timeCheckTo.isBetween(checkFrom, checkTo, null, "[]")
          ) {
            updatedTime = true;
          } else if (
            timeCheckFrom.isBetween(checkFrom, checkTo, null, "[]") ||
            timeCheckTo.isBetween(checkFrom, checkTo, null, "[]")
          ) {
            if (timeCheckFrom.isBefore(checkFrom)) {
              _disabledTimes[i].from = timeCheckFrom;
              updatedTime = true;
            } else if (timeCheckTo.isAfter(checkTo)) {
              _disabledTimes[i].to = timeCheckTo;
              updatedTime = true;
            }
          } else if (timeCheckFrom.isBefore(checkFrom) && timeCheckTo.isAfter(checkTo)) {
            _disabledTimes[i].from = timeCheckFrom;
            _disabledTimes[i].to = timeCheckTo;
            updatedTime = true;
          }

          if (updatedTime) {
            break;
          }
        }

        if (!updatedTime) {
          _disabledTimes.push({
            from: timeCheckFrom,
            to: timeCheckTo,
          });
        }
      }
    }

    setDisabledTimes(_disabledTimes);

    // console.log("disabke");
    // _disabledTimes.forEach(item => console.log(item.from.format(), item.to.format()));
  };

  const getAllTimeValues = async () => {
    const [hour, min, cycle] = await Promise.all([getDataValues("hour"), getDataValues("min"), getDataValues("cycle")]);

    setHourList(hour);
    setMinList(min);
    setCycleList(cycle);
  };

  const resetTimeToCenter = (time) => {
    const timeParsed = dayjs(time);

    try {
      HoursFlatList.current.scrollToIndex({
        index: parseInt(timeParsed.format("h")) + 1,
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

    if (!isDisabled(dayjs(value))) {
      return dayjs(value);
    }

    switch (type) {
      case "hour":
        for (let i = 0; i < 24; i++) {
          const valueCheck = currentDate.hour(i).minute(0).second(0);
          if (!isDisabled(valueCheck)) {
            return valueCheck;
          }
        }
        break;
      case "min":
        for (let i = 0; i < 60; i++) {
          const valueCheck = currentDate.minute(i).second(0);
          if (!isDisabled(valueCheck)) {
            return valueCheck;
          }
        }
        return getNearestAvailable("hour", value);
      case "cycle":
        console.log(currentDate.format("A"));
        if (currentDate.format("A") == "AM") {
          for (let i = 0; i < 12; i++) {
            const valueCheck = currentDate.hour(i).minute(0).second(0);
            if (!isDisabled(valueCheck)) {
              return valueCheck;
            }
          }
        } else {
          for (let i = 23; i >= 0; i--) {
            const valueCheck = currentDate.hour(i).minute(0).second(0);
            if (!isDisabled(valueCheck)) {
              return valueCheck;
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

        if (isDisabled(updatedTime)) {
          updatedTime = getNearestAvailable("cycle", updatedTime);
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

  const isDisabled = (timeValue) => {
    let t = dayjs(timeValue);
    const currentDate = dayjs(dateValue);

    if (minDate != null && t.isBefore(minDate, "minute")) {
      return true;
    }

    if (maxDate != null && t.isAfter(maxDate, "minute")) {
      return true;
    }

    t = t.year(currentDate.year()).dayOfYear(currentDate.dayOfYear());

    for (const disabledTime of disabledTimes) {
      if (t.isBetween(disabledTime.from, disabledTime.to, null, "[]")) {
        return true;
      }
    }

    return false;
  };

  const getDataValues = async (type) => {
    let dataValues = [];

    switch (type) {
      case "hour":
        dataValues = await Promise.all(
          [...Array(12).keys()].map(async (item) => {
            const t = item + 1;
            const checkT = dayjs(dateValue)
              .hour(dayjs(dateValue).format("A") == "AM" ? (t == 12 ? 0 : t) : t + 12 == 24 ? 12 : t + 12)
              .second(0);

            return {
              value: t,
              type: "time",
              disabled: isDisabled(checkT),
            };
          })
        );
        break;
      case "min":
        dataValues = await Promise.all(
          [...Array(60).keys()].map(async (item) => {
            const t = item.toString().length == 1 ? "0" + item : item;

            const checkT = dayjs(dateValue).minute(t).second(0);

            let disabled = false;

            disabled = await new Promise((resolve, reject) => {
              resolve(isDisabled(checkT));
            });

            return {
              value: t,
              type: "time",
              disabled: disabled,
            };
          })
        );
        break;
      case "cycle":
        dataValues = ["AM", "PM"].map((item) => {
          const t = item;
          let disabled = false;

          // let checkT = dayjs(dateValue);

          // if (checkT.format("A") != t) {
          //   const hoursChange = checkT.format("A") == "AM" ? 12 : -12;
          //   checkT = checkT.add(hoursChange, "hour");

          //   disabled = isDisabled(checkT, type);
          // }

          return {
            value: t,
            type: "time",
            disabled: disabled,
          };
        });
        break;
    }

    const empty = { value: "b", type: "empty", disabled: true };

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
          <TouchableWithoutFeedback
            disabled={item.type != "time" || item.disabled}
            onPress={() => onValueSelected(type, item.value, index)}>
            <View
              style={[
                styles.DateItemCard,
                {
                  opacity: item.type == "time" ? 1 : 0,
                },
              ]}>
              <Text
                style={
                  item.disabled
                    ? styles.DisabledText
                    : isSelected(type, item.value)
                    ? styles.SelectedText
                    : styles.NormalTextDate
                }>
                {item.value}
              </Text>
            </View>
          </TouchableWithoutFeedback>
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

export default TimePicker;

const styles = StyleSheet.create({
  BlockCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  DateItemCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    height: hp(5),
  },
  NormalTextDate: {
    fontSize: wp(4),
    fontFamily: "roboto-regular",
    color: "black",
    textAlign: "center",
  },
  SelectedText: {
    fontSize: wp(5),
    fontFamily: "roboto-bold",
    color: "#F34E5C",
    textAlign: "center",
  },
  DisabledText: {
    fontSize: wp(4),
    fontFamily: "roboto-regular",
    color: "#ccc",
    textAlign: "center",
  },
});
