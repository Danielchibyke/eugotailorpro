import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, Image, Button, ActivityIndicator } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import { theme } from '../styles/theme';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios'; // Keep axios for direct upload if needed, but use api.post for authenticated requests
import * as ImageManipulator from 'expo-image-manipulator';
import ImageZoomModal from '../components/ImageZoomModal';
import ClientSearchModal from '../components/ClientSearchModal';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useBookings } from '../hooks/useBookings';
import { useClients } from '../hooks/useClients';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getApi } from '../utils/api';


const AddBookingScreen = ({ navigation, route }) => {
    const { booking } = route.params || {};
    const { user } = useAuth();
    const { clients, loading: clientsLoading } = useClients();
    const { addBooking, updateBooking } = useBookings();
    const { showNotification } = useNotification();
    const api = getApi(); // Get the configured API instance

    // --- State Declarations ---
    const [formData, setFormData] = useState({
        client: null,
        bookingDate: new Date(),
        deliveryDate: new Date(),
        reminderDate: new Date(),
        status: 'Pending',
        notes: '',
        designs: [], // Changed to array
        price: '',
        payment: '',
    });
    const [selectedDesigns, setSelectedDesigns] = useState([]); // New state for multiple designs
    const [isUploading, setIsUploading] = useState(false);
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [datePickerField, setDatePickerField] = useState(null);
    const [isLoadingBooking, setIsLoadingBooking] = useState(true);
    const [clientSearchModalVisible, setClientSearchModalVisible] = useState(false);

    // --- Effects ---

    useEffect(() => {
        if (booking) {
            setIsLoadingBooking(true);
            setFormData({
                client: booking.client?._id,
                bookingDate: new Date(booking.bookingDate),
                deliveryDate: new Date(booking.deliveryDate),
                reminderDate: new Date(booking.reminderDate),
                status: booking.status,
                notes: booking.notes || '',
                designs: booking.designs || [], // Ensure designs is an array
                price: (booking.price || '').toString(),
                payment: (booking.payment || '').toString(),
            });
            if (booking.designs) {
                setSelectedDesigns(booking.designs);
            }
            setIsLoadingBooking(false);
        } else {
            setIsLoadingBooking(false);
        }
    }, [booking]);

    // --- Functions ---

    const openZoomModal = useCallback((imageUrl) => {
        setZoomedImage(imageUrl);
        setIsZoomModalVisible(true);
    }, []);

    const closeZoomModal = useCallback(() => {
        setIsZoomModalVisible(false);
        setZoomedImage(null);
    }, []);

    const openDatePicker = useCallback((field) => {
        setDatePickerField(field);
        setDatePickerVisible(true);
    }, []);

    const onDateChange = useCallback((params) => {
        setDatePickerVisible(false);
        handleInputChange(datePickerField, params.date);
    }, [datePickerField, handleInputChange]); // Added handleInputChange to dependencies

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const uploadImage = useCallback(async (uri, mimeType) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', {
            uri: uri,
            name: 'design_image.' + mimeType.split('/')[1],
            type: mimeType,
        });

        try {
            const response = await api.post('/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 520000,
            });
            console.log('Upload successful, response data:', response.data);
            showNotification('Image uploaded successfully!', 'success');
            return response.data.imageUrl;
        } catch (error) {
            console.error('Image upload error:', error);
            showNotification(error.response?.data?.msg || 'Failed to upload image.', 'error');
            return null;
        } finally {
            setIsUploading(false);
        }
    }, [api, showNotification]); // Dependencies for useCallback

    const pickImage = useCallback(async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: true,
        });

        if (!result.canceled) {
            const uris = result.assets.map(asset => asset.uri);
            const newDesigns = [...selectedDesigns];
            for (const uri of uris) {
                const manipResult = await ImageManipulator.manipulateAsync(
                    uri,
                    [],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );
                const uploadedUrl = await uploadImage(manipResult.uri, manipResult.mimeType || 'image/jpeg');
                if (uploadedUrl) {
                    newDesigns.push(uploadedUrl);
                }
            }
            setSelectedDesigns(newDesigns);
        }
    }, [selectedDesigns, uploadImage]); // Dependencies for useCallback

    // Defined as a regular async function
    async function handleSaveBooking() {
        console.log('handleSaveBooking called'); // Debug log
        if (!formData.client || !formData.price) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        const bookingData = {
            client: formData.client,
            price: parseFloat(formData.price) || 0,
            payment: parseFloat(formData.payment) || 0,
            bookingDate: dayjs(formData.bookingDate).toDate(),
            deliveryDate: dayjs(formData.deliveryDate).toDate(),
            reminderDate: dayjs(formData.reminderDate).toDate(),
            status: formData.status,
            notes: formData.notes || null,
            designs: selectedDesigns, // Use the array of selected designs
        };

        let result;
        if (booking) {
            result = await updateBooking(booking._id, bookingData);
        } else {
            result = await addBooking({ ...bookingData, bookedBy: user._id });
        }

        if (result.success) {
            showNotification(booking ? 'Booking updated successfully!' : 'Booking created successfully!', 'success');
            navigation.goBack();
        } else {
            showNotification(result.error, 'error');
        }
    } // No useCallback here

    const handleClientSelect = useCallback((client) => {
        setFormData(prev => ({ ...prev, client: client._id }));
        setClientSearchModalVisible(false);
    }, []);

    const handleAddNewClient = useCallback(() => {
        setClientSearchModalVisible(false);
        navigation.navigate('AddClient');
    }, [navigation]);

    // --- Render ---

    if (isLoadingBooking || clientsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
                <Text style={styles.loadingText}>Loading booking details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.heading}>{booking ? 'Edit Booking' : 'Add Booking'}</Text>
                <TouchableOpacity onPress={() => setClientSearchModalVisible(true)} style={styles.clientSelector}>
                    <Text style={styles.clientSelectorText}>
                        {formData.client ? clients.find(c => c._id === formData.client)?.name : 'Select a Client'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.COLORS.textMedium} />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Price"
                    value={formData.price}
                    onChangeText={(value) => handleInputChange('price', value)}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Payment"
                    value={formData.payment}
                    onChangeText={(value) => handleInputChange('payment', value)}
                    keyboardType="numeric"
                />
                <TouchableOpacity
                    style={styles.button}
                    onPress={pickImage}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator color={theme.COLORS.textLight} />
                    ) : (
                        <Text style={styles.buttonText}>Upload New Design Image</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => navigation.navigate('Gallery', {
                        selectMode: true,
                        multiple: true,
                        onSelect: (designs) => {
                            setSelectedDesigns(designs);
                        },
                        selectedDesigns: selectedDesigns
                    })}
                >
                    <Text style={styles.buttonText}>Select Design from Gallery</Text>
                </TouchableOpacity>
                {selectedDesigns.length > 0 && (
                    <View style={styles.selectedDesignContainer}>
                        <Text style={styles.selectedDesignTitle}>Selected Designs:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {selectedDesigns.map((uri, index) => (
                                <View key={index} style={styles.designPreviewWrapper}>
                                    <TouchableOpacity onPress={() => openZoomModal(uri)}>
                                        <Image source={{ uri: uri }} style={styles.designImagePreview} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setSelectedDesigns(prev => prev.filter((_, i) => i !== index))} style={styles.removeDesignButton}>
                                        <Ionicons name="close-circle" size={24} color={theme.COLORS.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
                <TextInput
                    style={styles.input}
                    placeholder="Notes"
                    value={formData.notes}
                    onChangeText={(value) => handleInputChange('notes', value)}
                    multiline
                />
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.status}
                        onValueChange={(itemValue) => handleInputChange('status', itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Pending" value="Pending" />
                        <Picker.Item label="Confirmed" value="Confirmed" />
                        <Picker.Item label="Completed" value="Completed" />
                        <Picker.Item label="Cancelled" value="Cancelled" />
                    </Picker>
                </View>
                <Text style={styles.dateLabel}>Booking Date</Text>
                <TouchableOpacity onPress={() => openDatePicker('bookingDate')} style={styles.dateInputButton}>
                    <Text style={styles.dateInputText}>{dayjs(formData.bookingDate).format('YYYY-MM-DD')}</Text>
                </TouchableOpacity>
                <Text style={styles.dateLabel}>Delivery Date</Text>
                <TouchableOpacity onPress={() => openDatePicker('deliveryDate')} style={styles.dateInputButton}>
                    <Text style={styles.dateInputText}>{dayjs(formData.deliveryDate).format('YYYY-MM-DD')}</Text>
                </TouchableOpacity>
                <Text style={styles.dateLabel}>Reminder Date</Text>
                <TouchableOpacity onPress={() => openDatePicker('reminderDate')} style={styles.dateInputButton}>
                    <Text style={styles.dateInputText}>{dayjs(formData.reminderDate).format('YYYY-MM-DD')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSaveBooking}>
                    <Text style={styles.buttonText}>{booking ? 'Save Changes' : 'Add Booking'}</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isDatePickerVisible}
                onRequestClose={() => setDatePickerVisible(false)}
            >
                <View style={styles.datePickerOverlay}>
                    <View style={styles.datePickerModalView}>
                        <DateTimePicker
                            date={formData[datePickerField] ? dayjs(formData[datePickerField]) : dayjs()}
                            mode="single"
                            onChange={onDateChange}
                        />
                    </View>
                </View>
            </Modal>

            {zoomedImage && (
                <ImageZoomModal
                    imageUrl={zoomedImage}
                    visible={isZoomModalVisible}
                    onClose={closeZoomModal}
                />
            )}

            <ClientSearchModal
                visible={clientSearchModalVisible}
                clients={clients}
                onSelect={handleClientSelect}
                onClose={() => setClientSearchModalVisible(false)}
                onAddNew={handleAddNewClient}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundApp,
    },
    loadingText: {
        marginTop: theme.SPACING.sm,
        color: theme.COLORS.textMedium,
    },
    content: {
        padding: theme.SPACING.md,
    },
    heading: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.md,
        textAlign: 'center',
    },
    picker: {
        backgroundColor: theme.COLORS.backgroundCard,
        marginBottom: theme.SPACING.md,
    },
    input: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
    },
    button: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
    },
    buttonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: theme.COLORS.secondary,
        marginTop: theme.SPACING.sm,
    },
    dateLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.sm,
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
    dateInputButton: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.sm,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        justifyContent: 'center',
    },
    dateInputText: {
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
    selectedDesignContainer: {
        alignItems: 'center',
        marginVertical: theme.SPACING.md,
    },
    selectedDesignTitle: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.sm,
    },
    designPreviewWrapper: {
        position: 'relative',
        marginRight: theme.SPACING.sm,
    },
    designImagePreview: {
        width: 100,
        height: 100,
        borderRadius: theme.BORDERRADIUS.md,
    },
    removeDesignButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: 12,
    },
    clearButton: {
        backgroundColor: theme.COLORS.error,
        padding: theme.SPACING.sm,
        borderRadius: theme.BORDERRADIUS.sm,
    },
    clearButtonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
    },
});

export default AddBookingScreen;
