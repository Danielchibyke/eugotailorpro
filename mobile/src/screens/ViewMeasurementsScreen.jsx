import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const ViewMeasurementsScreen = ({ route, navigation }) => {
    const { measurements: rawMeasurements } = route.params;

    const formattedMeasurements = Object.entries(rawMeasurements || {}).map(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
            return null;
        }
        const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); });
        const formattedValue = Array.isArray(value) ? value.join(', ') : value;
        return {
            name: formattedLabel,
            value: formattedValue,
        };
    }).filter(item => item !== null);

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemValue}>{item.value}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Measurements</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddEditMeasurement', { measurements: rawMeasurements, isTemplate: false })}>
                    <Ionicons name="add" size={24} color={theme.COLORS.primary} />
                </TouchableOpacity>
            </View>
            <FlatList
                data={formattedMeasurements}
                renderItem={renderItem}
                keyExtractor={(item) => item.name}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<Text style={styles.emptyText}>No measurements found.</Text>}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.SPACING.md,
        paddingVertical: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    listContainer: {
        padding: theme.SPACING.md,
    },
    itemContainer: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: theme.FONT_SIZES.md,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    itemValue: {
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textMedium,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: theme.SPACING.lg,
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textMedium,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textMedium,
        textAlign: 'center',
    },
    emptyStateSubText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.xs,
        textAlign: 'center',
    },
});

export default ViewMeasurementsScreen;
