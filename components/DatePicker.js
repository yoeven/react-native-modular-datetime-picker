import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableWithoutFeedback, FlatList } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import dayjs from "dayjs";
import { Icon } from "@ui-kitten/components";

const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekDaysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const CalenderPicker = ({ dateValue, endMode, fixed, minDate, maxDate, onChange, blocks }) => {
  const [dateView, setDateView] = useState(dateValue);
  const [mode, setMode] = useState(endMode);
  const [columns, setColumns] = useState(7);
  const [dataShown, setDataShown] = useState(null);

  useEffect(() => {
    onChangeCheck();

    switch (mode) {
      case "day":
      case "week":
        setColumns(7);
        break;
      case "month":
      case "year":
        setColumns(4);
        break;
    }
  }, [mode, dateView]);

  useEffect(() => {
    if (isDisabled(dateValue, mode)) {
      let newDate = getNearestAvailable(mode, dateValue);

      if (newDate != null) {
        setDateView(newDate);
        onChange({ mode: mode == endMode ? "final" : mode, dateValue: newDate.toDate() });
      }
    }
  }, [dateValue]);

  const onChangeCheck = () => {
    setDataShown(null);
    const data = getDataValues();
    setDataShown(data);
  };

  const getNearestAvailable = (type, value) => {
    const givenValue = dayjs(value);

    if (!isDisabled(dayjs(value))) {
      return dayjs(value);
    }

    switch (type) {
      case "week":
      case "day":
        for (let i = 1; i < givenValue.daysInMonth(); i++) {
          const valueCheck = givenValue.date(i);
          if (!isDisabled(valueCheck)) {
            return valueCheck;
          }
        }
        return getNearestAvailable("month", value);
      // case "week":
      //   for (let i = 0; i < 31; i++) {
      //     const valueCheck = givenValue.add(i, "day");

      //     if (!isDisabled(valueCheck)) {
      //       return valueCheck;
      //     }
      //   }
      //   return getNearestAvailable("month", value);
      case "month":
        for (let i = 0; i < 12; i++) {
          const valueCheck = givenValue.month(i);
          if (!isDisabled(valueCheck)) {
            return valueCheck;
          }
        }
        return getNearestAvailable("year", value);
      case "year":
        for (let i = 0; i < 12; i++) {
          const valueCheck = givenValue.add(i, "year");
          if (!isDisabled(valueCheck)) {
            return valueCheck;
          }
        }
        break;
    }

    return null;
  };

  const onModeChange = (newMode) => {
    setMode(newMode);
  };

  const onModeFoward = () => {
    let modeFoward = null;
    switch (mode) {
      case "month":
        modeFoward = endMode;
        break;
      case "year":
        modeFoward = "month";
        break;
    }
    if (modeFoward != null) {
      onModeChange(modeFoward);
    }
  };
  const onModeBackward = () => {
    let modeBack = null;
    switch (mode) {
      case "week":
      case "day":
        modeBack = "month";
        break;
      case "month":
        modeBack = "year";
        break;
    }
    if (modeBack != null) {
      onModeChange(modeBack);
      if (modeBack != endMode) {
        onChange({ mode: modeBack, dateValue: null });
      }
    }
  };

  const getTitleInfo = () => {
    let title = null;
    switch (mode) {
      case "week":
      case "day":
        title = dayjs(dateView).format("MMMM YYYY");
        break;
      case "month":
        title = dayjs(dateView).format("YYYY");
        break;
    }

    return title;
  };

  const isDisabled = (dateValue, modeCheck) => {
    const d = dayjs(dateValue);
    let compareCheck = "date";

    switch (modeCheck) {
      case "day":
      case "week":
        compareCheck = "date";
        break;
      case "month":
        compareCheck = "month";
        break;
      case "year":
        compareCheck = "year";
        break;
    }

    if (minDate != null && d.isBefore(dayjs(minDate), compareCheck)) {
      return true;
    }

    if (maxDate != null && d.isAfter(dayjs(maxDate), compareCheck)) {
      return true;
    }

    for (const block of blocks) {
      if (!block.hasOwnProperty("date")) continue;

      const dateCheck = dayjs(block.date);

      const repeat = block.repeat;
      switch (block.type) {
        case "date":
          if (compareCheck == "date") {
            if (repeat) {
              if (d.format("DDMM") == dateCheck.format("DDMM")) return true;
            } else {
              if (d.isSame(dateCheck, "date")) return true;
            }
          }
          break;
        case "week":
          if (d.isSame(dateCheck, "year") && d.isSame(dateCheck, "week") && compareCheck == "date") return true;
          break;
        case "weekday":
          if (d.format("dddd") == dateCheck.format("dddd") && compareCheck == "date") return true;
          break;
        case "month":
          if (repeat) {
            if (d.format("MM") == dateCheck.format("MM")) return true;
          } else {
            if (d.format("MMYYYY") == dateCheck.format("MMYYYY")) return true;
          }
          break;
        case "year":
          if (d.isSame(dateCheck, "year")) return true;
          break;
      }
    }

    return false;
  };

  const getDataValues = () => {
    let dataValues = [];
    switch (mode) {
      case "day":
      case "week":
        const startOfMonth = dayjs(dateView).startOf("month");
        const endOfMonth = dayjs(dateView).endOf("month");
        const days = endOfMonth.diff(startOfMonth, "day") + 1;
        const startWeekDay = startOfMonth.format("dd");
        const weekDayStartIndex = weekDaysShort.indexOf(startWeekDay);
        const startEmptySpace = Array.from(Array(weekDayStartIndex).keys()).map((item, index) => {
          return {
            value: item,
            type: "empty",
            disabled: true,
          };
        });
        const endWeekDay = endOfMonth.format("dd");
        const weekDayEndIndex = weekDaysShort.indexOf(endWeekDay);
        const endEmptySpace = Array.from(
          Array(weekDayEndIndex == weekDaysShort.length - 1 ? 0 : weekDaysShort.length - (weekDayEndIndex + 1)).keys()
        ).map((item, index) => {
          return {
            value: item,
            type: "empty",
            disabled: true,
          };
        });

        dataValues = Array.from(Array(days).keys()).map((item) => {
          const d = startOfMonth.add(item, "day");

          return {
            value: d,
            type: "date",
            disabled: isDisabled(d, mode),
          };
        });

        const weekDaysShortMapped = [...weekDaysShort].map((item) => {
          return {
            value: item,
            type: "header",
          };
        });

        dataValues = [...weekDaysShortMapped, ...startEmptySpace, ...dataValues, ...endEmptySpace];
        break;
      case "month":
        dataValues = [...monthsShort].map((item, index) => {
          const d = dayjs(dateView).month(index);

          return {
            value: d,
            type: "date",
            disabled: isDisabled(d, mode),
          };
        });
        break;
      case "year":
        let yearStart = dayjs();

        if (dayjs(dateView).isAfter(yearStart, "year")) {
          while (dayjs(dateView).diff(yearStart, "year") >= 11) {
            yearStart = yearStart.add(12, "year");
          }
        } else if (dayjs(dateView).isBefore(yearStart, "year")) {
          let diff = dateView.diff(dayjs(yearStart), "year");

          while (!(diff >= 0 && diff < 12)) {
            yearStart = yearStart.subtract(12, "year");
            diff = dateView.diff(dayjs(yearStart), "year");
          }
        }

        dataValues = Array.from(Array(12).keys()).map((item, index) => {
          const d = dayjs(yearStart).add(index, "year");

          return {
            value: d,
            type: "date",
            disabled: isDisabled(d, mode),
          };
        });
        break;
    }

    return dataValues;
  };

  const isSelected = (date) => {
    const dateParsed = dayjs(date);

    switch (mode) {
      case "day":
        return dateParsed.format("DDMMYYYY") == dayjs(dateValue).format("DDMMYYYY");
      case "week":
        const startWeek = dayjs(dateValue).startOf("week");
        const endWeek = dayjs(dateValue).endOf("week");
        return (
          dateParsed.isSameOrAfter(startWeek) && dateParsed.isSameOrBefore(endWeek) && !isDisabled(dateParsed, mode)
        );
      case "month":
        return dateParsed.format("MMYYYY") == dayjs(dateValue).format("MMYYYY");
      case "year":
        return dateParsed.format("YYYY") == dayjs(dateValue).format("YYYY");
    }
  };

  const onValueSelected = (date) => {
    let updatedDate = null;
    switch (mode) {
      case "day":
      case "week":
        updatedDate = dayjs(date);
        break;
      case "month":
        updatedDate = dayjs(dateView).month(dayjs(date).month());
        updatedDate = updatedDate.date(dayjs(date).endOf("month").date());
        break;
      case "year":
        updatedDate = dayjs(dateView).year(dayjs(date).year());
        updatedDate = updatedDate.month(dayjs(date).endOf("year").month());
        break;
    }

    if (!fixed && endMode != mode) {
      onModeFoward();
    }

    setDateView(updatedDate);

    onChange({ mode: mode == endMode ? "final" : mode, dateValue: updatedDate.toDate() });
  };

  const getDateValueToShow = (date) => {
    const parsedDate = dayjs(date);
    let formattedText = null;
    switch (mode) {
      case "week":
      case "day":
        formattedText = parsedDate.format("D");
        break;
      case "month":
        formattedText = parsedDate.format("MMM");
        break;
      case "year":
        formattedText = parsedDate.format("YYYY");
        break;
    }
    return formattedText;
  };

  const changeSet = (moveState) => {
    const currentDateView = dayjs(dateView);
    let updatedView = null;
    const amountToMove = moveState == "next" ? 1 : -1;
    switch (mode) {
      case "week":
      case "day":
        updatedView = currentDateView.add(amountToMove, "month");
        break;
      case "month":
        updatedView = currentDateView.add(amountToMove, "year");
        break;
      case "year":
        updatedView = currentDateView.add(amountToMove * 12, "year");
        break;
    }
    setDateView(updatedView);
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: hp(2),
        }}>
        <View style={{ flexDirection: "row" }}>
          <TouchableWithoutFeedback onPress={() => changeSet("back")}>
            <View style={{ paddingRight: wp(1.5) }}>
              <Icon name="chevron-left-outline" width={wp(6)} height={wp(6)} fill="black" />
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => changeSet("next")}>
            <View style={{ paddingLeft: wp(1.5) }}>
              <Icon name="chevron-right-outline" width={wp(6)} height={wp(6)} fill="black" />
            </View>
          </TouchableWithoutFeedback>
        </View>

        {mode != "year" && !fixed && (
          <TouchableWithoutFeedback onPress={() => onModeBackward()}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontFamily: "roboto-bold", fontSize: wp(5) }}>{getTitleInfo()}</Text>
              <Icon name="chevron-down-outline" width={wp(6)} height={wp(6)} fill="black" />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>

      {dataShown != null && (
        <FlatList
          key={columns}
          ItemSeparatorComponent={() => <View style={{ height: hp(1.5) }} />}
          data={dataShown}
          numColumns={columns}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={{ marginLeft: index % columns !== 0 ? wp(3) : 0, flex: 1 }}>
              {index < 7 && item.type == "header" ? (
                <View style={[styles.BlockCard]}>
                  <Text style={{ color: "grey", fontSize: wp(4), fontFamily: "roboto-regular" }}>{item.value}</Text>
                </View>
              ) : (
                <TouchableWithoutFeedback
                  disabled={item.type != "date" || item.disabled}
                  onPress={() => onValueSelected(item.value)}>
                  <View
                    style={[
                      styles.DateItemCard,
                      {
                        backgroundColor: isSelected(item.value) ? "#F34E5C" : undefined,
                        opacity: item.type == "date" ? 1 : 0,
                      },
                    ]}>
                    <Text
                      style={
                        item.disabled
                          ? styles.DisabledText
                          : isSelected(item.value)
                          ? styles.SelectedText
                          : styles.NormalTextDate
                      }>
                      {getDateValueToShow(item.value)}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

CalenderPicker.defaultProps = {
  dateValue: new Date(),
  endMode: "day",
  fixed: false,
  minDate: null,
  maxDate: null,
  onChange: () => {},
  blocks: [],
};

export default CalenderPicker;

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
    paddingHorizontal: wp(2),
    paddingVertical: hp(1),
    // aspectRatio: 1,
    borderRadius: 5,
  },
  NormalTextDate: {
    fontSize: wp(4),
    fontFamily: "roboto-regular",
    color: "black",
    textAlign: "center",
  },
  SelectedText: {
    fontSize: wp(4),
    fontFamily: "roboto-bold",
    color: "white",
    textAlign: "center",
  },
  DisabledText: {
    fontSize: wp(4),
    fontFamily: "roboto-regular",
    color: "#ddd",
    textAlign: "center",
  },
});
