import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getApi } from '../utils/api';
import theme from '../styles/theme';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import BackgroundContainer from '../components/BackgroundContainer';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { chartColors } from '../styles/chartColors';
import { PERMISSIONS, getUserEffectivePermissions } from '../config/permissions';


const { width } = Dimensions.get('window');

const CashBookScreen = ({ route }) => {
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const { user } = useAuth();

  const permissions = useMemo(() => getUserEffectivePermissions(user), [user]);
  const canViewFinancials = permissions.includes(PERMISSIONS.FINANCIALS_VIEW);
  const canBalanceFinancials = permissions.includes(PERMISSIONS.FINANCIALS_MANAGE);


  const [transactions, setTransactions] = useState([]);
  const [balanceRecords, setBalanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('cashbook'); // 'cashbook', 'analytics'
  const [highlightedTransaction, setHighlightedTransaction] = useState(null);

  useEffect(() => {
    if (route.params?.id) {
      setHighlightedTransaction(route.params.id);
    }
  }, [route.params?.id]);

  const fetchCashBookData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsResponse, balanceRecordsResponse] = await Promise.all([
        getApi().get('/transactions'),
        getApi().get('/balances')
      ]);
      
      const transactionsData = Array.isArray(transactionsResponse?.data) 
        ? transactionsResponse.data 
        : [];
      
      const balanceRecordsData = Array.isArray(balanceRecordsResponse?.data) 
        ? balanceRecordsResponse.data 
        : [];
      
      
      
      setTransactions(prev => {
       
        return transactionsResponse.data;
      });
      
      setBalanceRecords(prev => {
        
        return balanceRecordsResponse.data;
      });
      
    } catch (error) {
      console.log('API Error details:', {
        message: error.message,
        response: error.response,
        config: error.config
      });
      showNotification(error.response?.data?.msg || 'Failed to fetch cashbook data.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showNotification]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCashBookData();
  }, [fetchCashBookData]);

  useEffect(() => {
    if (canViewFinancials) {
        fetchCashBookData();
        const unsubscribe = navigation.addListener('focus', fetchCashBookData);
        return unsubscribe;
    }
  }, [navigation, canViewFinancials, fetchCashBookData]);

  const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(30, 'days').toDate());
  const [filterEndDate, setFilterEndDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState('start');

  const { rows: cashbookData, financialSummary, chartData, categoryChartData } = useMemo(() => {
    let cashBalance = 0;
    let bankBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let cashFlowData = [];
    let categoryData = { income: {}, expense: {} };

    const latestBalanceRecord = balanceRecords[0];
    if (latestBalanceRecord) {
      cashBalance = latestBalanceRecord.cashBalance;
      bankBalance = latestBalanceRecord.bankBalance;
    }

    const rows = latestBalanceRecord ? [{
      id: 'opening-balance',
      type: 'balance',
      date: latestBalanceRecord.lastBalancedDate,
      particulars: 'Opening Balance',
      debitCash: cashBalance,
      debitBank: bankBalance,
      creditCash: 0,
      creditBank: 0,
      balanceCash: cashBalance,
      balanceBank: bankBalance,
      isBalanceRecord: true
    }] : [];

const processedTransactions = transactions
  .filter(t => {
    if (!t.date) return false;
    
    const transactionDate = new Date(t.date);
    if (isNaN(transactionDate.getTime())) return false;
    
    const transactionDay = new Date(transactionDate);
    transactionDay.setHours(0, 0, 0, 0);
    
    const startDay = new Date(filterStartDate);
    startDay.setHours(0, 0, 0, 0);
    
    const endDay = new Date(filterEndDate);
    endDay.setHours(23, 59, 59, 999);
    
    return transactionDay >= startDay && transactionDay <= endDay;
  })
  .sort((a, b) => new Date(a.date) - new Date(b.date));

  
    processedTransactions.forEach(transaction => {
      const isCash = transaction.paymentMethod === 'Cash';
      const isBank = transaction.paymentMethod === 'Bank';
      const amount = transaction.amount;

      if (transaction.type === 'income') {
        totalIncome += amount;
        if (isCash) cashBalance += amount;
        if (isBank) bankBalance += amount;

        const category = transaction.category || transaction.description?.split(' ')[0] || 'Other';
        categoryData.income[category] = (categoryData.income[category] || 0) + amount;
      } else {
        totalExpense += amount;
        if (isCash) cashBalance -= amount;
        if (isBank) bankBalance -= amount;

        const category = transaction.category || transaction.description?.split(' ')[0] || 'Other';
        categoryData.expense[category] = (categoryData.expense[category] || 0) + amount;
      }

      rows.push({
        id: transaction._id,
        type: transaction.type,
        date: transaction.date,
        particulars: transaction.description,
        category: transaction.category,
        debitCash: transaction.type === 'income' && isCash ? amount : 0,
        debitBank: transaction.type === 'income' && isBank ? amount : 0,
        creditCash: transaction.type === 'expense' && isCash ? amount : 0,
        creditBank: transaction.type === 'expense' && isBank ? amount : 0,
        balanceCash: cashBalance,
        balanceBank: bankBalance,
        isBalanceRecord: false
      });

      const dateKey = dayjs(transaction.date).format('YYYY-MM-DD');
      if (!cashFlowData.find(d => d.date === dateKey)) {
        cashFlowData.push({ date: dateKey, income: 0, expense: 0, net: 0 });
      }
      const dayData = cashFlowData.find(d => d.date === dateKey);
      if (transaction.type === 'income') {
        dayData.income += amount;
        dayData.net += amount;
      } else {
        dayData.expense += amount;
        dayData.net -= amount;
      }
    });

    rows.push({
      id: 'closing-balance',
      type: 'balance',
      date: new Date(),
      particulars: 'Closing Balance',
      debitCash: 0,
      debitBank: 0,
      creditCash: 0,
      creditBank: 0,
      balanceCash: cashBalance,
      balanceBank: bankBalance,
      isBalanceRecord: true
    });

   

// ... in useMemo for cashbookData
    const incomeCategories = Object.entries(categoryData.income).map(([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
      legendFontColor: theme.COLORS.textDark,
      legendFontSize: 12
    }));

    const expenseCategories = Object.entries(categoryData.expense).map(([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
      legendFontColor: theme.COLORS.textDark,
      legendFontSize: 12
    }));

    return {
      rows,
      financialSummary: {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
        cashBalance,
        bankBalance,
        categoryData,
        daysInPeriod: dayjs(filterEndDate).diff(dayjs(filterStartDate), 'day') + 1,
        avgDailyIncome: totalIncome / (dayjs(filterEndDate).diff(dayjs(filterStartDate), 'day') + 1),
        avgDailyExpense: totalExpense / (dayjs(filterEndDate).diff(dayjs(filterStartDate), 'day') + 1)
      },
      chartData: cashFlowData.sort((a, b) => dayjs(a.date).diff(dayjs(b.date))),
      categoryChartData: {
        income: incomeCategories,
        expense: expenseCategories
      }
    };
  }, [transactions, balanceRecords, filterStartDate, filterEndDate]);

  const handleDateSelect = (date) => {
    const selectedDate = date.date;
    if (currentPicker === 'start') {
      setFilterStartDate(selectedDate);
    } else {
      setFilterEndDate(selectedDate);
    }
    setIsDatePickerVisible(false);
  };

  
  const handleBalanceCashBook = useCallback(async () => {
    try {
      await getApi().post('/balances/setLastBalancedDate', {
        cashBalance: financialSummary.cashBalance,
        bankBalance: financialSummary.bankBalance,
        
        date: new Date()

      });
      showNotification('Cashbook balanced successfully!', 'success');
      fetchCashBookData();
    } catch (error) {
      showNotification(error.response?.data?.msg || 'Failed to balance cashbook.', 'error');
    }
  }, [financialSummary, user, showNotification, fetchCashBookData]);

  const handleExport = async () => {
    try {
      const csvContent = 'Date,Particulars,Debit Cash,Debit Bank,Credit Cash,Credit Bank,Balance Cash,Balance Bank\n' + 
        cashbookData.map(row => 
          `${dayjs(row.date).format('YYYY-MM-DD')},"${row.particulars}",${row.debitCash},${row.debitBank},${row.creditCash},${row.creditBank},${row.balanceCash},${row.balanceBank}`
        ).join('\n');
      
      const path = `${RNFS.CachesDirectoryPath}/cashbook_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      await RNFS.writeFile(path, csvContent, 'utf8');
      
      const options = {
        type: 'text/csv',
        url: path, // Pass the raw path
        title: 'Share Cashbook CSV',
        subject: 'Cashbook Data',
      };

      await Share.open(options);
      showNotification('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      showNotification('Failed to export data.', 'error');
    }
  };

  const renderCashBookRow = ({ item }) => (
    <View style={[
      styles.row,
      item.id === highlightedTransaction && styles.highlightedRow,
      item.type === 'balance' && styles.balanceRow,
      item.type === 'income' && styles.incomeRow,
      item.type === 'expense' && styles.expenseRow
    ]}>
      <Text style={[styles.dateCell, item.type === 'balance' && styles.balanceRowText]}>{dayjs(item.date).format('DD MMM')}</Text>
      <Text style={[styles.particularsCell, item.type === 'balance' && styles.balanceRowText]} numberOfLines={1}>{item.particulars}</Text>
      <View style={styles.amountColumn}>
        <Text style={[styles.amountText, item.debitCash > 0 && styles.debitText]}>
          {item.debitCash > 0 ? `Cash ₦${item.debitCash.toFixed(2)}` : ''}
        </Text>
        <Text style={[styles.amountText, item.debitBank > 0 && styles.debitText]}>
          {item.debitBank > 0 ? `Bank ₦${item.debitBank.toFixed(2)}` : ''}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={[styles.amountText, item.creditCash > 0 && styles.creditText]}>
          {item.creditCash > 0 ? `Cash ₦${item.creditCash.toFixed(2)}` : ''}
        </Text>
        <Text style={[styles.amountText, item.creditBank > 0 && styles.creditText]}>
          {item.creditBank > 0 ? `Bank ₦${item.creditBank.toFixed(2)}` : ''}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={[styles.amountText, styles.balanceText, item.type === 'balance' && styles.balanceRowText]}> Cash {` ₦${item.balanceCash.toFixed(2)}`}</Text>
        <Text style={[styles.amountText, styles.balanceText, item.type === 'balance' && styles.balanceRowText]}>Bank {` ₦${item.balanceBank.toFixed(2)}`}</Text>
      </View>
    </View>
  );

  const renderCashBook = () => (
    <>
      <View style={styles.listHeader}>
        <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
        <Text style={[styles.headerCell, styles.particularsCell]}>Particulars</Text>
        <Text style={[styles.headerCell, styles.amountCell]}>Debit</Text>
        <Text style={[styles.headerCell, styles.amountCell]}>Credit</Text>
        <Text style={[styles.headerCell, styles.amountCell]}>Balance</Text>
      </View>

      <FlatList
        data={cashbookData}
        renderItem={renderCashBookRow}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </>
  );

  const renderAnalytics = () => (
    <ScrollView 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Financial Summary Cards */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Ionicons name="trending-up" size={24} color={theme.COLORS.success} />
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryValue, styles.incomeText]}>₦{financialSummary.totalIncome.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Ionicons name="trending-down" size={24} color={theme.COLORS.danger} />
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={[styles.summaryValue, styles.expenseText]}>₦{financialSummary.totalExpense.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.netCard]}>
            <Ionicons 
              name={financialSummary.netCashFlow >= 0 ? "arrow-up" : "arrow-down"} 
              size={24} 
              color={financialSummary.netCashFlow >= 0 ? theme.COLORS.success : theme.COLORS.danger} 
            />
            <Text style={styles.summaryLabel}>Net Cash Flow</Text>
            <Text style={[styles.summaryValue, 
              financialSummary.netCashFlow >= 0 ? styles.incomeText : styles.expenseText
            ]}>
              ₦{Math.abs(financialSummary.netCashFlow).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.balanceCard]}>
            <Ionicons name="wallet" size={24} color={theme.COLORS.primary} />
            <Text style={styles.summaryLabel}>Total Balance</Text>
            <Text style={[styles.summaryValue, styles.balanceText]}>
              ₦{(financialSummary.cashBalance + financialSummary.bankBalance).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Daily Averages */}
      <View style={styles.averagesContainer}>
        <Text style={styles.sectionTitle}>Daily Averages</Text>
        <View style={styles.averagesGrid}>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Income</Text>
            <Text style={[styles.averageValue, styles.incomeText]}>
              ₦{financialSummary.avgDailyIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Expense</Text>
            <Text style={[styles.averageValue, styles.expenseText]}>
              ₦{financialSummary.avgDailyExpense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Net</Text>
            <Text style={[styles.averageValue, 
              financialSummary.netCashFlow >= 0 ? styles.incomeText : styles.expenseText
            ]}>
              ₦{(financialSummary.avgDailyIncome - financialSummary.avgDailyExpense).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Cash Flow Chart */}
      {chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Cash Flow Trend</Text>
          <LineChart
            data={{
              labels: chartData.slice(-7).map(d => dayjs(d.date).format('DD MMM')),
              datasets: [
                {
                  data: chartData.slice(-7).map(d => d.income),
                  color: (opacity = 1) => theme.COLORS.success,
                  strokeWidth: 2
                },
                {
                  data: chartData.slice(-7).map(d => d.expense),
                  color: (opacity = 1) => theme.COLORS.danger,
                  strokeWidth: 2
                },
                {
                  data: chartData.slice(-7).map(d => d.net),
                  color: (opacity = 1) => theme.COLORS.primary,
                  strokeWidth: 3
                }
              ]
            }}
            width={width - 32}
            height={220}
            chartConfig={{
              backgroundColor: theme.COLORS.light,
              backgroundGradientFrom: theme.COLORS.light,
              backgroundGradientTo: theme.COLORS.light,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Category Analysis */}
      <View style={styles.categoryContainer}>
        <Text style={styles.sectionTitle}>Income Categories</Text>
        {categoryChartData.income.length > 0 ? (
          <>
            <PieChart
              data={categoryChartData.income}
              width={width - 32}
              height={160}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            {Object.entries(financialSummary.categoryData.income).map(([category, amount]) => (
              <View key={category} style={styles.categoryItem}>
                <Text style={styles.categoryName}>{category}</Text>
                <View style={styles.categoryBar}>
                  <Progress.Bar 
                    progress={amount / financialSummary.totalIncome} 
                    width={width - 120}
                    color={theme.COLORS.success}
                  />
                </View>
                <Text style={styles.categoryAmount}>₦{amount.toFixed(2)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.noDataText}>No income data available</Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Expense Categories</Text>
        {categoryChartData.expense.length > 0 ? (
          <>
            <PieChart
              data={categoryChartData.expense}
              width={width - 32}
              height={160}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            {Object.entries(financialSummary.categoryData.expense).map(([category, amount]) => (
              <View key={category} style={styles.categoryItem}>
                <Text style={styles.categoryName}>{category}</Text>
                <View style={styles.categoryBar}>
                  <Progress.Bar 
                    progress={amount / financialSummary.totalExpense} 
                    width={width - 120}
                    color={theme.COLORS.danger}
                  />
                </View>
                <Text style={styles.categoryAmount}>₦{amount.toFixed(2)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.noDataText}>No expense data available</Text>
        )}
      </View>
    </ScrollView>
  );

  if (loading) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.COLORS.primary} />
                    <Text style={styles.loadingText}>Loading Cash Book Data...</Text>
                </View>
            </BackgroundContainer>
        );
    }

    if (!canViewFinancials) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyStateText}>Access Denied</Text>
                    <Text style={styles.emptyStateSubText}>You do not have permission to view the cash book.</Text>
                </View>
            </BackgroundContainer>
        );
    }

    return (
        <BackgroundContainer>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Double Column Cash Book</Text>
                
                {/* Date Filter */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity 
                        style={styles.dateButton}
                        onPress={() => { setCurrentPicker('start'); setIsDatePickerVisible(true); }}
                    >
                        <Ionicons name="calendar" size={16} color="white" />
                        <Text style={styles.dateText}>{dayjs(filterStartDate).format('DD MMM YY')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.dateSeparator}>to</Text>
                    <TouchableOpacity 
                        style={styles.dateButton}
                        onPress={() => { setCurrentPicker('end'); setIsDatePickerVisible(true); }}
                    >
                        <Ionicons name="calendar" size={16} color="white" />
                        <Text style={styles.dateText}>{dayjs(filterEndDate).format('DD MMM YY')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    {['cashbook', 'analytics'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Ionicons 
                                name={tab === 'cashbook' ? 'book' : 'analytics'} 
                                size={16} 
                                color={activeTab === tab ? theme.COLORS.primary : 'white'} 
                            />
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab === 'cashbook' ? 'Cash Book' : 'Analytics'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Actions */}
                <View style={styles.actionButtons}>
                    {canBalanceFinancials && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleBalanceCashBook}>
                            <Ionicons name="checkmark-circle" size={20} color="white" />
                            <Text style={styles.actionButtonText}>Balance</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
                        <Ionicons name="download" size={20} color="white" />
                        <Text style={styles.actionButtonText}>Export</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'cashbook' ? renderCashBook() : renderAnalytics()}
            </View>

            {/* Date Picker Modal */}
            <Modal visible={isDatePickerVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <DateTimePicker
                            mode="single"
                            date={currentPicker === 'start' ? filterStartDate : filterEndDate}
                            onChange={handleDateSelect}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setIsDatePickerVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.COLORS.primary,
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    gap: 4,
  },
  dateText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  dateSeparator: {
    color: 'white',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  activeTabText: {
    color: theme.COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.secondary,
    padding: 10,
    borderRadius: 8,
    gap: 4,
    minWidth: 100,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    backgroundColor: theme.COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: theme.COLORS.primary,
  },
  headerCell: {
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    fontSize: 12,
  },
  dateCell: { 
    width: 60,
    fontSize: 12,
    color: theme.COLORS.textDark,
  },
  particularsCell: { 
    flex: 2, 
    marginLeft: 8,
    fontSize: 12,
    color: theme.COLORS.textDark,
  },
  amountCell: { 
    flex: 1, 
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
    alignItems: 'center',
    minHeight: 50,
    backgroundColor: theme.COLORS.backgroundCard,
    marginBottom: 4,
    borderRadius: 8,
  },
  incomeRow: {
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.success,
    backgroundColor: 'white',
  },
  expenseRow: {
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.danger,
    backgroundColor: 'white',
  },
  balanceRow: {
    backgroundColor: theme.COLORS.primary,
    fontWeight: 'bold',
  },
  highlightedRow: {
    backgroundColor: theme.COLORS.secondary,
  },
  balanceRowText: {
    color: theme.COLORS.textLight,
  },
  amountColumn: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 12,
    color: theme.COLORS.textDark,
  },
  debitText: {
    color: theme.COLORS.success,
    fontWeight: '500',
  },
  creditText: {
    color: theme.COLORS.danger,
    fontWeight: '500',
  },
  balanceText: {
    fontWeight: 'bold',
    color: theme.COLORS.primary,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.success,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.danger,
  },
  netCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.warning,
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.COLORS.textMedium,
    marginBottom: 4,
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeText: {
    color: theme.COLORS.success,
  },
  expenseText: {
    color: theme.COLORS.danger,
  },
  averagesContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  averagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  averageItem: {
    alignItems: 'center',
    flex: 1,
  },
  averageLabel: {
    fontSize: 12,
    color: theme.COLORS.textMedium,
    marginBottom: 4,
  },
  averageValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
  },
  categoryName: {
    width: 60,
    fontSize: 12,
    color: theme.COLORS.textDark,
    fontWeight: '500',
  },
  categoryBar: {
    flex: 1,
    marginHorizontal: 8,
  },
  categoryAmount: {
    width: 70,
    textAlign: 'right',
    fontSize: 12,
    color: theme.COLORS.textDark,
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    color: theme.COLORS.textMedium,
    fontStyle: 'italic',
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
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
    gap: 16,
  },
  loadingText: {
    color: theme.COLORS.primary,
    fontSize: 16,
  },
});

export default CashBookScreen;
