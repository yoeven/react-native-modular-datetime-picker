import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Button } from "@ui-kitten/components";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
import dayjs from "dayjs";

const DateTimePicker = (props) => {
  const { dateValue, onClose, onConfirm, onFinalChange, selectorMode } = props;
  const [showConfirm, setShowConfirm] = useState(true);
  const [dateTimeSelected, setDateTimeSelected] = useState(dateValue);

  useEffect(() => {
    console.log("datetimepicker loop");

    setDateTimeSelected(dayjs(dateValue));

    console.log("dateValue int", dateValue);
  }, [dateValue]);

  const onDateChange = ({ mode, dateValue }) => {
    if (dateValue != null && (mode == "final" || mode == "month")) {
      setShowConfirm(true);
      const newSelected = dayjs(dateValue);

      const updateSelected = dayjs(dateTimeSelected).year(newSelected.year()).dayOfYear(newSelected.dayOfYear());

      setDateTimeSelected(updateSelected);
      onFinalChange(updateSelected);
    } else {
      setShowConfirm(false);
    }
  };

  const onTimeChange = ({ timeValue }) => {
    console.log(timeValue);
    if (timeValue != null) {
      const newSelected = dayjs(timeValue);
      const updateSelected = dayjs(dateTimeSelected).hour(newSelected.hour()).minute(newSelected.minute());

      console.log("time update");

      setDateTimeSelected(updateSelected);
    }
  };
  return (
    <View>
      <View style={styles.InnerContentWrapper}>
        {selectorMode.includes("date") && (
          <DatePicker {...props} dateValue={dateTimeSelected} onChange={onDateChange} />
        )}

        {showConfirm && selectorMode.includes("time") && (
          <View style={styles.TimeWrapper}>
            <TimePicker {...props} dateValue={dateTimeSelected} onChange={onTimeChange} />
          </View>
        )}
      </View>
      <View style={styles.ButtonButtonWrapper}>
        {showConfirm && (
          <Button
            disabled={!showConfirm}
            onPress={() => onConfirm(dateTimeSelected)}
            status={"primary"}
            style={styles.SuccessButton}
            appearance="outline">
            {"Confirm"}
          </Button>
        )}

        <Button
          style={{ marginTop: hp(1) }}
          onPress={onClose}
          status={"primary"}
          textStyle={{ color: "grey" }}
          appearance="ghost">
          {"Cancel"}
        </Button>
      </View>
    </View>
  );
};

DateTimePicker.defaultProps = {
  dateValue: dayjs(),
  onClose: () => {},
  onConfirm: () => {},
  onFinalChange: () => {},
  selectorMode: "datetime",
};

export default DateTimePicker;

const styles = StyleSheet.create({
  InnerContentWrapper: {
    paddingTop: hp(3),
    paddingHorizontal: wp(5),
  },
  ButtonButtonWrapper: {
    marginTop: hp(5),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  SuccessButton: {
    backgroundColor: "rgba(1,1,1,0)",
  },
  TimeWrapper: {
    marginTop: hp(3),
    backgroundColor: "#f8f8f8",
    borderRadius: 5,
  },
});
