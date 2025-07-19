import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import theme from '../styles/theme';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import BackgroundContainer from '../components/BackgroundContainer';

const CashBookScreen = () => {
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  
  // State
  const [cashbookData, setCashbookData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastBalancedDate, setLastBalancedDate] = useState(null);
  const [finalClosingBalance, setFinalClosingBalance] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState('start');

  // Fetch data
  const fetchCashBookData = useCallback(async () => {
    setLoading(true);
    try {
      const [balancesRes, transactionsRes] = await Promise.all([
        api.get('/balances'),
        api.get('/transactions')
      ]);

      const processedData = processCashBookData(
        balancesRes.data,
        transactionsRes.data
      );
      
      setCashbookData(processedData.rows);
      setLastBalancedDate(processedData.lastBalancedDate);
      setFinalClosingBalance(processedData.finalBalance);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load cashbook data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Process data into cashbook format
  const processCashBookData = (balances, transactions) => {
    let rows = [];
    let currentCashBalance = 0;
    let currentBankBalance = 0;
    let lastBalancedDate = null;

    // Find the latest balance record to set the initial opening balance
    const latestBalanceRecord = balances.sort((a, b) => new Date(b.lastBalancedDate) - new Date(a.lastBalancedDate))[0];

    if (latestBalanceRecord) {
      currentCashBalance = latestBalanceRecord.cashBalance;
      currentBankBalance = latestBalanceRecord.bankBalance;
      lastBalancedDate = latestBalanceRecord.lastBalancedDate;

      rows.push({
        id: 'opening-balance',
        type: 'balance',
        date: latestBalanceRecord.lastBalancedDate,
        particularsDebit: 'Opening Balance',
        particularsCredit: '',
        debitCash: currentCashBalance,
        debitBank: currentBankBalance,
        creditCash: null,
        creditBank: null,
        runningCash: currentCashBalance,
        runningBank: currentBankBalance,
      });
    }

    // Sort transactions by date
    const sortedTransactions = transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedTransactions.forEach(transaction => {
      const isCash = transaction.paymentMethod === 'Cash';
      const isBank = transaction.paymentMethod === 'Bank Transfer' || transaction.paymentMethod === 'Card';

      const particulars = transaction.description || (transaction.client ? `Client: ${transaction.client.name}` : 'N/A');

      if (transaction.type === 'Income') {
        if (isCash) {
          currentCashBalance += transaction.amount;
        } else if (isBank) {
          currentBankBalance += transaction.amount;
        }
        rows.push({
          id: transaction._id,
          type: 'income',
          date: transaction.date,
          particularsDebit: particulars,
          particularsCredit: '',
          debitCash: isCash ? transaction.amount : null,
          debitBank: isBank ? transaction.amount : null,
          creditCash: null,
          creditBank: null,
          runningCash: currentCashBalance,
          runningBank: currentBankBalance,
        });
      } else if (transaction.type === 'Expense') {
        if (isCash) {
          currentCashBalance -= transaction.amount;
        } else if (isBank) {
          currentBankBalance -= transaction.amount;
        }
        rows.push({
          id: transaction._id,
          type: 'expense',
          date: transaction.date,
          particularsDebit: '',
          particularsCredit: particulars,
          debitCash: null,
          debitBank: null,
          creditCash: isCash ? transaction.amount : null,
          creditBank: isBank ? transaction.amount : null,
          runningCash: currentCashBalance,
          runningBank: currentBankBalance,
        });
      }
    });

    // Add a closing balance row
    rows.push({
      id: 'closing-balance',
      type: 'total',
      date: new Date(), // Use current date for closing balance row
      particularsDebit: 'Closing Balance',
      particularsCredit: '',
      debitCash: null,
      debitBank: null,
      creditCash: null,
      creditBank: null,
      runningCash: currentCashBalance,
      runningBank: currentBankBalance,
    });

    return {
      rows,
      lastBalancedDate: lastBalancedDate,
      finalBalance: { cash: currentCashBalance, bank: currentBankBalance },
    };
  };

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return cashbookData;
    
    return cashbookData.filter(row => {
      if (!row.date) return false;
      
      const rowDate = new Date(row.date);
      const start = filterStartDate ? new Date(filterStartDate) : null;
      const end = filterEndDate ? new Date(filterEndDate) : null;
      
      return (
        (!start || rowDate >= start) &&
        (!end || rowDate <= end)
      );
    });
  }, [cashbookData, filterStartDate, filterEndDate]);

  // Handle date selection
  const handleDateSelect = (date) => {
    const selectedDate = date.date;
    if (currentPicker === 'start') {
      setFilterStartDate(selectedDate);
    } else {
      setFilterEndDate(selectedDate);
    }
    setIsDatePickerVisible(false);
  };

  // Balance cashbook
  const handleBalanceCashBook = useCallback(async () => {
    setLoading(true);
    try {
      // Your existing balance logic
      await fetchCashBookData();
      showNotification('Cashbook balanced successfully', 'success');
    } catch (error) {
      showNotification('Failed to balance cashbook', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchCashBookData, showNotification]);

  // Effects
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchCashBookData);
    return unsubscribe;
  }, [navigation, fetchCashBookData]);

  // Render item for FlatList
  const renderItem = ({ item, index }) => (
    <CashBookRow 
      item={item} 
      index={index} 
      isLast={index === filteredData.length - 1}
    />
  );

  if (loading) {
    return (
      <BackgroundContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
          <Text style={styles.loadingText}>Loading cashbook...</Text>
        </View>
      </BackgroundContainer>
    );
  }

  return (
    <BackgroundContainer>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Cashbook</Text>
        
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>
            Last Balanced: {lastBalancedDate ? dayjs(lastBalancedDate).format('DD MMM YYYY') : 'Never'}
          </Text>
          {finalClosingBalance && (
            <Text style={styles.balanceAmount}>
              Cash: {finalClosingBalance.cash.toFixed(2)} | Bank: {finalClosingBalance.bank.toFixed(2)}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.balanceButton}
          onPress={handleBalanceCashBook}
        >
          <Text style={styles.balanceButtonText}>Balance Now</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter Controls */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => {
            setCurrentPicker('start');
            setIsDatePickerVisible(true);
          }}
        >
          <Text style={styles.dateInputText}>
            {filterStartDate ? dayjs(filterStartDate).format('DD MMM YY') : 'Start Date'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.dateSeparator}>to</Text>
        
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => {
            setCurrentPicker('end');
            setIsDatePickerVisible(true);
          }}
        >
          <Text style={styles.dateInputText}>
            {filterEndDate ? dayjs(filterEndDate).format('DD MMM YY') : 'End Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cashbook List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={[styles.headerCell, styles.dateHeader]}>Date</Text>
          <Text style={[styles.headerCell, styles.debitHeader]}>Debit</Text>
          <Text style={[styles.headerCell, styles.creditHeader]}>Credit</Text>
        </View>
        
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
        />
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={isDatePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <DateTimePicker
              mode="single"
              date={currentPicker === 'start' ? 
                (filterStartDate ? dayjs(filterStartDate) : dayjs()) : 
                (filterEndDate ? dayjs(filterEndDate) : dayjs())}
              onChange={handleDateSelect}
              selectedItemColor={theme.COLORS.primary}
              headerTextStyle={styles.pickerHeader}
              // Add other DateTimePicker props as needed
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsDatePickerVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </BackgroundContainer>
  );
};

// CashBookRow Component
const CashBookRow = React.memo(({ item, index, isLast }) => {
  const rowStyles = [
    styles.row,
    index % 2 === 0 ? styles.evenRow : styles.oddRow,
    item.type === 'balance' && styles.balanceRow,
    item.type === 'total' && styles.totalRow,
    isLast && styles.lastRow,
  ];

  return (
    <View style={rowStyles}>
      <Text style={styles.dateCell}>
        {item.date ? dayjs(item.date).format('DD MMM') : ''}
      </Text>
      
      {/* Debit Column */}
      <View style={styles.debitColumn}>
        <Text style={styles.particulars} numberOfLines={1}>
          {item.particularsDebit}
        </Text>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {item.debitCash ? item.debitCash.toFixed(2) : ''}
          </Text>
          <Text style={styles.amount}>
            {item.debitBank ? item.debitBank.toFixed(2) : ''}
          </Text>
        </View>
      </View>
      
      {/* Credit Column */}
      <View style={styles.creditColumn}>
        <Text style={styles.particulars} numberOfLines={1}>
          {item.particularsCredit}
        </Text>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {item.creditCash ? item.creditCash.toFixed(2) : ''}
          </Text>
          <Text style={styles.amount}>
            {item.creditBank ? item.creditBank.toFixed(2) : ''}
          </Text>
        </View>
      </View>
    </View>
  );
});

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.backgroundApp,
  },
  header: {
    padding: 16,
    backgroundColor: theme.COLORS.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  balanceAmount: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  balanceButton: {
    backgroundColor: theme.COLORS.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.COLORS.backgroundCard,
  },
  dateInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dateInputText: {
    textAlign: 'center',
    color: theme.COLORS.textDark,
  },
  dateSeparator: {
    marginHorizontal: 8,
    color: theme.COLORS.textMedium,
  },
  listContainer: {
    flex: 1,
    backgroundColor: theme.COLORS.backgroundLight,
  },
  listHeader: {
    flexDirection: 'row',
    backgroundColor: theme.COLORS.backgroundCard,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
  },
  headerCell: {
    fontWeight: 'bold',
    color: theme.COLORS.textDark,
  },
  dateHeader: {
    width: 70,
    paddingLeft: 8,
  },
  debitHeader: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 8,
  },
  creditHeader: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.borderLight,
  },
  evenRow: {
    backgroundColor: theme.COLORS.backgroundLight,
  },
  oddRow: {
    backgroundColor: theme.COLORS.backgroundCard,
  },
  balanceRow: {
    backgroundColor: theme.COLORS.backgroundAccent,
  },
  totalRow: {
    backgroundColor: '#e8f5e9',
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.primary,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  dateCell: {
    width: 70,
    paddingLeft: 8,
    color: theme.COLORS.textMedium,
    fontSize: 12,
  },
  debitColumn: {
    flex: 1,
    flexDirection: 'row',
  },
  creditColumn: {
    flex: 1,
    flexDirection: 'row',
  },
  particulars: {
    flex: 1,
    paddingLeft: 8,
    fontSize: 14,
    color: theme.COLORS.textDark,
  },
  amountContainer: {
    width: 80,
  },
  amount: {
    textAlign: 'right',
    paddingRight: 8,
    fontSize: 13,
    color: theme.COLORS.textDark,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  pickerHeader: {
    color: theme.COLORS.primary,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.COLORS.textMedium,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.COLORS.textMedium,
  },
});

export default CashBookScreen;