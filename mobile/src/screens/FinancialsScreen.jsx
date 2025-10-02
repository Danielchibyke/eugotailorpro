import React, { useState, useEffect, useCallback , useMemo} from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';

import { useNetInfo } from '@react-native-community/netinfo';
import BackgroundContainer from '../components/BackgroundContainer';
import TransactionCard from '../components/TransactionCard';
import ClientSearchModal from '../components/ClientSearchModal';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getApi } from '../utils/api';
import theme from '../styles/theme';
import { getUserEffectivePermissions, PERMISSIONS } from '../config/permissions';

const FinancialsScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [clients, setClients] = useState([]);
    const netInfo = useNetInfo();

    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [clientSearchModalVisible, setClientSearchModalVisible] = useState(false);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        description: '',
        client: null,
        paymentMethod: 'Cash',
        voucherNo: '',
        date: new Date(),
    });

    const { showNotification } = useNotification();
    const permissions = useMemo(() => getUserEffectivePermissions(user), [user]);
    const canViewFinancials = permissions.includes(PERMISSIONS.FINANCIALS_VIEW);
    const canCreateFinancials = permissions.includes(PERMISSIONS.FINANCIALS_MANAGE);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getApi().get('/transactions');
            const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(sortedData);
        } catch (err) {
            console.error('Failed to fetch transactions from API:', err);
            showNotification(err.response?.data?.msg || 'Failed to fetch transactions.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const fetchClients = useCallback(async () => {
        try {
            const { data } = await getApi().get('/clients');
            setClients(data);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshUser();
        });
        return unsubscribe;
    }, [navigation, refreshUser]);

    useEffect(() => {
        if (canViewFinancials) {
            fetchTransactions();
            fetchClients();

            if (navigation.getState().routes[navigation.getState().index].params?.openModal) {
                openAddTransactionModal();
                navigation.setParams({ openModal: false }); // Reset param
            }
        }
    }, [canViewFinancials, navigation]);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleClientSelect = (client) => {
        setFormData({ ...formData, client: client });
        setClientSearchModalVisible(false);
    };

    const handleAddNewClient = () => {
        setClientSearchModalVisible(false);
        navigation.navigate('AddClient');
    };

    const openAddTransactionModal = () => {
        setFormData({
            type: 'income',
            amount: '',
            description: '',
            client: null,
            paymentMethod: 'Cash',
            voucherNo: '',
            date: new Date(),
        });
        setClientSearchModalVisible(false);
        setModalVisible(true);
    };

    const handleAddTransaction = async () => {
        if (!formData.amount || !formData.description) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        try {
            const transactionData = {
                type: formData.type,
                amount: parseFloat(formData.amount) || 0,
                description: formData.description,
                client: formData.client?._id,
                paymentMethod: formData.paymentMethod,
                voucherNo: formData.voucherNo || null,
                date: dayjs(formData.date).toISOString(),
                recordedBy: user._id,
            };

            const response = await getApi().post('/transactions', transactionData);
            setTransactions(prev => [response.data, ...prev]); // Prepend new transaction
            showNotification('Transaction added successfully!', 'success');
            setModalVisible(false);
        } catch (error) {
            showNotification(error.response?.data?.msg || 'Failed to add transaction.', 'error');
        }
    };

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Financial Overview</Text>
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Net Balance</Text>
                <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit={true}>₦{netBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryContainer}>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Total Income</Text>
                    <Text style={[styles.summaryValue, { color: theme.COLORS.textLight }]} numberOfLines={1} adjustsFontSizeToFit={true}>₦{totalIncome.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Total Expense</Text>
                    <Text style={[styles.summaryValue, { color: theme.COLORS.textLight }]} numberOfLines={1} adjustsFontSizeToFit={true}>₦{totalExpense.toFixed(2)}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.cashbookButton} onPress={() => navigation.navigate('CashBook')}>
                <Ionicons name="book-outline" size={20} color={theme.COLORS.primary} />
                <Text style={styles.cashbookButtonText}>View Full Cashbook</Text>
            </TouchableOpacity>
            
        </View>
    );

    if (!canViewFinancials) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.emptyStateText}>Access Denied</Text>
                <Text style={styles.emptyStateSubText}>
                    You do not have permission to view financials.
                </Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
            </View>
        );
    }

    return (
        <BackgroundContainer>
            <FlatList
                data={transactions}
                renderItem={({ item }) => <TransactionCard transaction={item} />}
                keyExtractor={(item) => item._id} // Remove .toHexString()
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No transactions yet.</Text>
                        <Text style={styles.emptyStateSubText}>Tap the '+' button to add one!</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={fetchTransactions}
            />

            {canCreateFinancials && (
                <TouchableOpacity style={styles.fab} onPress={openAddTransactionModal}>
                    <Ionicons name="add" size={30} color={theme.COLORS.textLight} />
                </TouchableOpacity>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>New Transaction</Text>

                            <View style={styles.typeSelector}>
                                <TouchableOpacity
                                    style={[styles.typeButton, formData.type === 'income' && styles.typeButtonSelected]}
                                    onPress={() => handleInputChange('type', 'income')}
                                >
                                    <Text style={[styles.typeButtonText, formData.type === 'income' && styles.typeButtonTextSelected]}>Income</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonSelected]}
                                    onPress={() => handleInputChange('type', 'expense')}
                                >
                                    <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.typeButtonTextSelected]}>Expense</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Fabric purchase"
                                value={formData.description}
                                onChangeText={(value) => handleInputChange('description', value)}
                            />

                            <Text style={styles.label}>Amount</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={String(formData.amount)}
                                onChangeText={(value) => handleInputChange('amount', value)}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.dateInputButton}>
                                <Text style={styles.dateInputText}>{dayjs(formData.date).format('YYYY-MM-DD')}</Text>
                            </TouchableOpacity>

                            <Text style={styles.label}>Payment Method</Text>
                            <View style={styles.typeSelector}>
                                <TouchableOpacity
                                    style={[styles.typeButton, formData.paymentMethod === 'Cash' && styles.typeButtonSelected]}
                                    onPress={() => handleInputChange('paymentMethod', 'Cash')}
                                >
                                    <Text style={[styles.typeButtonText, formData.paymentMethod === 'Cash' && styles.typeButtonTextSelected]}>Cash</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeButton, formData.paymentMethod === 'Bank' && styles.typeButtonSelected]}
                                    onPress={() => handleInputChange('paymentMethod', 'Bank')}
                                >
                                    <Text style={[styles.typeButtonText, formData.paymentMethod === 'Bank' && styles.typeButtonTextSelected]}>Bank</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Client (Optional)</Text>
                            <TouchableOpacity onPress={() => setClientSearchModalVisible(true)} style={styles.clientSelector}>
                                <Text style={styles.clientSelectorText}>
                                    {formData.client ? formData.client.name : 'Select a Client'}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color={theme.COLORS.textMedium} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={handleAddTransaction}>
                                <Text style={styles.buttonText}>Add Transaction</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
                {isDatePickerVisible && (
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={isDatePickerVisible}
                        onRequestClose={() => setDatePickerVisible(false)}
                    >
                        <View style={styles.datePickerOverlay}>
                            <View style={styles.datePickerModalView}>
                                <DateTimePicker
                                    date={formData.date ? dayjs(formData.date) : dayjs()}
                                    mode="single"
                                    onChange={(params) => {
                                        setDatePickerVisible(false);
                                        handleInputChange('date', params.date);
                                    }}
                                />
                            </View>
                        </View>
                    </Modal>
                )}
            </Modal>

            <ClientSearchModal
                visible={clientSearchModalVisible}
                clients={clients} 
                onSelect={handleClientSelect}
                onClose={() => setClientSearchModalVisible(false)}
                onAddNew={handleAddNewClient}
            />
        </BackgroundContainer>
    );
};





const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundApp,
    },
    list: {
        paddingBottom: 80,
    },
    headerContainer: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: theme.SPACING.md,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
        textAlign: 'center',
        marginBottom: theme.SPACING.md,
    },
    balanceContainer: {
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
    },
    balanceLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textLight,
    },
    balanceValue: {
        fontSize: 42,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
    },
    summaryBox: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textLight,
    },
    summaryValue: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: '600',
        color: theme.COLORS.textLight,
    },
    cashbookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.sm,
        marginTop: theme.SPACING.md,
        width: '100%',
    },
    cashbookButtonText: {
        color: theme.COLORS.primary,
        fontWeight: 'bold',
        marginLeft: theme.SPACING.sm,
    },
    
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyStateText: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textMedium,
    },
    emptyStateSubText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.xs,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: theme.BORDERRADIUS.xxxl,
        backgroundColor: theme.COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.SHADOWS.lg,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: theme.COLORS.overlayBackground,
    },
    modalView: {
        backgroundColor: theme.COLORS.backgroundApp,
        borderTopLeftRadius: theme.BORDERRADIUS.xxl,
        borderTopRightRadius: theme.BORDERRADIUS.xxl,
        padding: theme.SPACING.lg,
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
        textAlign: 'center',
        marginBottom: theme.SPACING.lg,
    },
    label: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginBottom: theme.SPACING.xs,
        marginLeft: theme.SPACING.xs,
    },
    input: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        fontSize: theme.FONT_SIZES.body,
    },
    dateInputButton: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        justifyContent: 'center',
    },
    dateInputText: {
        fontSize: theme.FONT_SIZES.body,
    },
    pickerContainer: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        marginBottom: theme.SPACING.md,
        justifyContent: 'center',
        // On iOS, the picker needs a fixed height to render correctly inside a modal.
        ...Platform.select({
            ios: {
                height: 200,
            },
        }),
    },
    picker: {
        width: '100%',
        ...Platform.select({
            android: {
                height: 50,
                color: theme.COLORS.textDark,
            },
            ios: {
                // Height is set in container
            },
        }),
    },
    typeSelector: {
        flexDirection: 'row',
        borderRadius: theme.BORDERRADIUS.md,
        backgroundColor: theme.COLORS.backgroundCard,
        marginBottom: theme.SPACING.lg,
        overflow: 'hidden',
    },
    typeButton: {
        flex: 1,
        padding: theme.SPACING.md,
        alignItems: 'center',
    },
    typeButtonSelected: {
        backgroundColor: theme.COLORS.primary,
    },
    typeButtonText: {
        fontSize: theme.FONT_SIZES.body,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    typeButtonTextSelected: {
        color: theme.COLORS.textLight,
    },
    button: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.lg,
        borderRadius: theme.BORDERRADIUS.md,
        alignItems: 'center',
        marginBottom: theme.SPACING.sm,
    },
    cancelButton: {
        backgroundColor: theme.COLORS.backgroundCard,
    },
    buttonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.button,
    },
    clientSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.lg,
    },
    clientSelectorText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
    },
    datePickerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.COLORS.overlayBackground,
    },
    datePickerModalView: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.lg,
        padding: theme.SPACING.lg,
    },
});

export default FinancialsScreen;