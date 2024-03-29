import React, { memo } from "react";
import { StyleSheet, Text, View, TouchableWithoutFeedback } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const TimeSelectionItem = ({ index, item, onValueSelected, type, isSelected }) => {
  return (
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
        <Text style={item.disabled ? styles.DisabledText : isSelected ? styles.SelectedText : styles.NormalTextDate}>
          {item.value}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default memo(TimeSelectionItem);

const styles = StyleSheet.create({
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
