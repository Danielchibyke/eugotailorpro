import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { getApi } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { theme } from '../styles/theme';
import BackgroundContainer from '../components/BackgroundContainer';

const MeasurementTemplatesScreen = ({ navigation }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getApi().get('/measurement-templates');
            setTemplates(data);
        } catch (error) {
            showNotification(error.response?.data?.msg || 'Failed to fetch templates.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchTemplates();
        const unsubscribe = navigation.addListener('focus', fetchTemplates);
        return unsubscribe;
    }, [navigation, fetchTemplates]);

    const handleDeleteTemplate = async (templateId) => {
        Alert.alert(
            'Delete Template',
            'Are you sure you want to delete this template?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            await getApi().delete(`/measurement-templates/${templateId}`);
                            setTemplates(prevTemplates => prevTemplates.filter(t => t._id !== templateId));
                            showNotification('Template deleted successfully!', 'success');
                        } catch (error) {
                            showNotification(error.response?.data?.msg || 'Failed to delete template.', 'error');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.templateCard}
            onPress={() => navigation.navigate('AddEditMeasurement', { template: item })}
            onLongPress={() => handleDeleteTemplate(item._id)}
        >
            <View>
                <Text style={styles.templateName}>{item.name}</Text>
                {item.measurements ? (
                    <View style={styles.measurementsPreview}>
                        {Object.entries(item.measurements).map(([key, value]) => {
                            if (!value || (Array.isArray(value) && value.length === 0)) {
                                return null;
                            }
                            const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); });
                            const formattedValue = Array.isArray(value) ? value.join(', ') : value;
                            return (
                                <Text key={key} style={styles.measurementText}>
                                    {formattedLabel}: {formattedValue}
                                </Text>
                            );
                        })}
                    </View>
                ) : (
                    <Text style={styles.noMeasurementsText}>No measurements in this template.</Text>
                )}
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color={theme.COLORS.primary} />
        </TouchableOpacity>
    );

    return (
        <BackgroundContainer>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={theme.COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Measurement Templates</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AddEditMeasurement', { isTemplate: true })}>
                        <Ionicons name="add-circle-outline" size={30} color={theme.COLORS.primary} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={templates}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id.toHexString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No templates found. Tap + to add one.</Text>
                    }
                />
            </SafeAreaView>
        </BackgroundContainer>
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
    listContent: {
        padding: theme.SPACING.md,
    },
    templateCard: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    templateName: {
        fontSize: theme.FONT_SIZES.md,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.sm,
    },
    measurementsPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    measurementText: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
        marginRight: theme.SPACING.md,
        marginBottom: theme.SPACING.xs,
    },
    noMeasurementsText: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
        fontStyle: 'italic',
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

export default MeasurementTemplatesScreen;
