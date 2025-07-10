import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const DatePickerModal = ({ isVisible, onClose, onDateChange, currentDate }) => {
    const handleDateChange = (date) => {
        onDateChange(date);
        onClose();
    };

    // This is a simplified date picker for demonstration.
    // In a real app, you'd integrate a proper date picker library or native component.
    // For now, it just simulates selection.
    const simulateDateSelection = () => {
        const today = new Date();
        handleDateChange(today);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Select Date</Text>
                    <Text style={styles.currentDateText}>Current: {currentDate ? currentDate.toDateString() : 'None'}</Text>
                    <TouchableOpacity style={styles.selectButton} onPress={simulateDateSelection}>
                        <Text style={styles.selectButtonText}>Select Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: theme.FONT_SIZES.h2,
        marginBottom: 15,
        textAlign: "center",
    },
    currentDateText: {
        fontSize: theme.FONT_SIZES.body,
        marginBottom: 20,
    },
    selectButton: {
        backgroundColor: theme.COLORS.primary,
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginBottom: 10,
    },
    selectButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    closeButton: {
        backgroundColor: theme.COLORS.error,
        borderRadius: 10,
        padding: 10,
        elevation: 2,
    },
    closeButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
});

export default DatePickerModal;