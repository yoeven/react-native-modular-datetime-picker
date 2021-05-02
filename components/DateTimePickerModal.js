import React, { meno } from "react";
import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal";
import DateTimePicker from "./DateTimePicker";
import SafeAreaView from "react-native-safe-area-view";

const DateTimePickerModal = (props) => {
  const { onClose, isVisible } = props;

  return (
    <Modal
      backdropOpacity={0.5}
      style={{ justifyContent: "flex-end", margin: 0 }}
      useNativeDriver={true}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={true}
      isVisible={isVisible}>
      <View style={styles.ModalWrapper}>
        <SafeAreaView forceInset={{ bottom: "always" }}>
          <DateTimePicker {...props} onClose={onClose} />
        </SafeAreaView>
      </View>
    </Modal>
  );
};

DateTimePickerModal.defaultProps = {
  onClose: () => {},
  isVisible: true,
};

export default meno(DateTimePickerModal);

const styles = StyleSheet.create({
  ModalWrapper: {
    backgroundColor: "white",
    borderTopStartRadius: 8,
    borderTopEndRadius: 8,
  },
});
