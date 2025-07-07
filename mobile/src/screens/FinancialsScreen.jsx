import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import TransactionCard from '../components/TransactionCard';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const FinancialsScreen = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const [clients, setClients] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        description: '',
        client: null,
        paymentMethod: 'Cash',
        voucherNo: '',
    });
    const { showNotification } = useNotification();

    const fetchTransactions = useCallback(async () => {
        try {
            const { data } = await api.get('/transactions');
            setTransactions(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch transactions.', 'error');
        }
    }, [showNotification]);

    const fetchClients = useCallback(async () => {
        try {
            const { data } = await api.get('/clients');
            setClients(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch clients.', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchTransactions();
            fetchClients();
        });
        return unsubscribe;
    }, [navigation, fetchTransactions, fetchClients]);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleAddTransaction = async () => {
        if (!formData.amount || !formData.description) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        try {
            await api.post('/transactions', {
                ...formData,
                amount: parseFloat(formData.amount),
            });
            showNotification('Transaction added successfully!', 'success');
            setModalVisible(false);
            fetchTransactions();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to add transaction.', 'error');
        }
    };

    const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    return (
        <View style={styles.container}>
            <TopNavbar />
            <View style={styles.header}>
                <Text style={styles.heading}>Financials</Text>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CashBook')}>
                        <Ionicons name="book" size={24} color="#fff" />
                        <Text style={styles.addButtonText}>Cash Book</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <Ionicons name="ios-add" size={24} color="#fff" />
                        <Text style={styles.addButtonText}>Add Transaction</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.summaryContainer}>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Income</Text>
                    <Text style={[styles.summaryValue, { color: theme.COLORS.success }]}>
                        ₦{totalIncome.toFixed(2)}
                    </Text>
                </View>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Expense</Text>
                    <Text style={[styles.summaryValue, { color: theme.COLORS.error }]}>
                        ₦{totalExpense.toFixed(2)}
                    </Text>
                </View>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Balance</Text>
                    <Text style={styles.summaryValue}>₦{netBalance.toFixed(2)}</Text>
                </View>
            </View>
            <FlatList
                data={transactions}
                renderItem={({ item }) => <TransactionCard transaction={item} />}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.noTransactionsText}>No transactions found.</Text>}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                style={ {justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
            }}
            >
                <ScrollView style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Add Transaction</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Description"
                            value={formData.description}
                            onChangeText={(value) => handleInputChange('description', value)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Amount"
                            value={formData.amount}
                            onChangeText={(value) => handleInputChange('amount', value)}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Voucher No."
                            value={formData.voucherNo}
                            onChangeText={(value) => handleInputChange('voucherNo', value)}
                        />
                        <Picker
                            selectedValue={formData.client}
                            onValueChange={(itemValue) => handleInputChange('client', itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select a client" value={null} />
                            {clients.map((client) => (
                                <Picker.Item key={client._id} label={client.name} value={client._id} />
                            ))}
                        </Picker>
                        <Picker
                            selectedValue={formData.paymentMethod}
                            onValueChange={(itemValue) => handleInputChange('paymentMethod', itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Cash" value="Cash" />
                            <Picker.Item label="Bank" value="Bank" />
                        </Picker>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeButton, formData.type === 'income' && styles.typeButtonSelected]}
                                onPress={() => handleInputChange('type', 'income')}
                            >
                                <Text style={styles.typeButtonText}>Income</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonSelected]}
                                onPress={() => handleInputChange('type', 'expense')}
                            >
                                <Text style={styles.typeButtonText}>Expense</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.button} onPress={handleAddTransaction}>
                            <Text style={styles.buttonText}>Add</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.SPACING.md,
        backgroundColor: theme.COLORS.backgroundCard,
    },
    buttonsContainer: {
        flexDirection: 'row',
    },
    heading: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.primary,
        paddingVertical: theme.SPACING.sm,
        paddingHorizontal: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: theme.SPACING.sm,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: theme.SPACING.md,
    },
    summaryBox: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
    },
    summaryValue: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
    },
    list: {
        padding: theme.SPACING.md,
    },
    noTransactionsText: {
        textAlign: 'center',
        marginTop: theme.SPACING.lg,
        color: theme.COLORS.textMedium,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
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
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: theme.COLORS.backgroundApp,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
    },
    typeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: theme.SPACING.md,
    },
    typeButton: {
        padding: theme.SPACING.sm,
        borderRadius: theme.BORDERRADIUS.sm,
        borderWidth: 1,
        borderColor: theme.COLORS.primary,
    },
    typeButtonSelected: {
        backgroundColor: theme.COLORS.primary,
    },
    typeButtonText: {
        color: theme.COLORS.primary,
    },
    button: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
        width: '100%',
        marginBottom: theme.SPACING.sm,
    },
    cancelButton: {
        backgroundColor: theme.COLORS.error,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    picker: {
        backgroundColor: theme.COLORS.backgroundCard,
        marginBottom: theme.SPACING.md,
    },
});

export default FinancialsScreen;