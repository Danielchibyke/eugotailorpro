import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, Image, ActivityIndicator } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import { theme } from '../styles/theme';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
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
import { getUserEffectivePermissions, PERMISSIONS } from '../config/permissions';

const AddBookingScreen = ({ navigation, route }) => {
    const { booking } = route.params || {};
    const { user } = useAuth();
    const { clients, loading: clientsLoading } = useClients();
    const { addBooking, updateBooking } = useBookings();
    const { showNotification } = useNotification();
    const api = getApi();

    // --- State Declarations ---
    const [formData, setFormData] = useState({
        client: null,
        bookingDate: new Date(),
        deliveryDate: new Date(),
        reminderDates: [],
        status: 'Pending',
        notes: '',
        designs: [],
        price: '',
        payment: '',
    });
    const [selectedDesigns, setSelectedDesigns] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
    const [dateTimePickerField, setDateTimePickerField] = useState(null);
    const [editingReminderIndex, setEditingReminderIndex] = useState(null);
    const [tempSelectedDate, setTempSelectedDate] = useState({ date: new Date(), time: new Date() });
    
    const [isLoadingBooking, setIsLoadingBooking] = useState(true);
    const [clientSearchModalVisible, setClientSearchModalVisible] = useState(false);

    const permissions = useMemo(() => getUserEffectivePermissions(user), [user]);
    const canViewBookings = permissions.includes(PERMISSIONS.BOOKINGS_VIEW);
    const canCreateBookings = permissions.includes(PERMISSIONS.BOOKINGS_CREATE);
    
    if (!canCreateBookings) {
        navigation.goBack();
        showNotification('You do not have permission to create or edit bookings.', 'error');
        return null;
    }

    // --- Effects ---
    useEffect(() => {
        if (booking) {
            setFormData({
                client: booking.client?._id,
                bookingDate: new Date(booking.bookingDate),
                deliveryDate: new Date(booking.deliveryDate),
                reminderDates: booking.reminderDates && Array.isArray(booking.reminderDates) ? booking.reminderDates.map(reminder => ({ date: new Date(reminder.date), user: reminder.user })) : [],
                status: booking.status,
                notes: booking.notes || '',
                designs: booking.designs || [],
                price: (booking.price || '').toString(),
                payment: (booking.payment || '').toString(),
            });
            if (booking.designs) {
                setSelectedDesigns(booking.designs);
            }
        }
        setIsLoadingBooking(false);
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

    const openDateTimePicker = useCallback((field, index = null) => {
        setDateTimePickerField(field);
        setEditingReminderIndex(index);
        
        let initialDate;
        if (field === 'reminderDates') {
            // For reminder dates, use the specific reminder date if editing an existing one
            if (index !== null && formData.reminderDates && formData.reminderDates[index]) {
                initialDate = formData.reminderDates[index].date;
            } else {
                // For new reminder, default to the delivery date or current date
                initialDate = formData.deliveryDate || new Date();
            }
        } else {
            // For other fields (bookingDate, deliveryDate)
            initialDate = formData[field] || new Date();
        }
        
        console.log(`Opening date picker for ${field}, index: ${index}, initial date:`, initialDate);
        
        setTempSelectedDate({ 
            date: initialDate, 
            time: initialDate 
        });
        setDateTimePickerVisible(true);
    }, [formData]);

    const onDateTimeChange = (params) => {
        if (!params.date) return;
        setTempSelectedDate(prev => ({
            date: dayjs(params.date).toDate(),
            time: dayjs(params.date).toDate()
        }));
    };

    const handleConfirmDateTime = useCallback(() => {
        const combinedDate = dayjs(tempSelectedDate.date)
            .hour(dayjs(tempSelectedDate.time).hour())
            .minute(dayjs(tempSelectedDate.time).minute())
            .toDate();
    
        console.log(`Confirmed date: ${combinedDate}, field: ${dateTimePickerField}, index: ${editingReminderIndex}`);
    
        if (dateTimePickerField === 'reminderDates') {
            const updated = formData.reminderDates ? [...formData.reminderDates] : [];
            const reminderObject = { date: combinedDate, user: user._id };
            
            if (editingReminderIndex !== null) {
                // Update existing reminder
                updated[editingReminderIndex] = reminderObject;
            } else {
                // Add new reminder
                updated.push(reminderObject);
            }
            
            setFormData(prev => ({ ...prev, reminderDates: updated }));
        } else {
            // For bookingDate or deliveryDate
            setFormData(prev => ({ ...prev, [dateTimePickerField]: combinedDate }));
        }
        
        setDateTimePickerVisible(false);
        setEditingReminderIndex(null); // Reset the editing index
    }, [dateTimePickerField, editingReminderIndex, tempSelectedDate, formData.reminderDates, user._id]);
    
    const handleCancelDateTime = useCallback(() => {
        setDateTimePickerVisible(false);
    }, []);

    

    

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
    }, [api, showNotification]);

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
    }, [selectedDesigns, uploadImage]);

    async function handleSaveBooking() {
        console.log('handleSaveBooking called');
        console.log('Form data on save:', formData);
        if (!formData.client || !formData.price) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        if (dayjs(formData.deliveryDate).isBefore(dayjs(formData.bookingDate))) {
            showNotification('Delivery date cannot be before the booking date.', 'error');
            return;
        }

        for (const reminder of formData.reminderDates) {
            if (dayjs(reminder.date).isAfter(dayjs(formData.deliveryDate))) {
                showNotification('Reminder date cannot be after the delivery date.', 'error');
                return;
            }
        }

        const bookingData = {
            client: formData.client,
            price: parseFloat(formData.price) || 0,
            payment: parseFloat(formData.payment) || 0,
            bookingDate: dayjs(formData.bookingDate).format('YYYY-MM-DDTHH:mm:ss'),
            deliveryDate: dayjs(formData.deliveryDate).format('YYYY-MM-DDTHH:mm:ss'),
            reminderDates: formData.reminderDates.map(reminder => ({ 
                date: dayjs(reminder.date).format('YYYY-MM-DDTHH:mm:ss'),
                user: reminder.user 
            })),
            status: formData.status,
            notes: formData.notes || null,
            designs: selectedDesigns,
        };

        console.log('Booking data being sent to server:', bookingData);

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
    }

    const handleClientSelect = useCallback((client) => {
        setFormData(prev => ({ ...prev, client: client._id }));
        setClientSearchModalVisible(false);
    }, []);

    const handleAddNewClient = useCallback(() => {
        setClientSearchModalVisible(false);
        navigation.navigate('AddClient');
    }, [navigation]);
    console.log(dateTimePickerField, tempSelectedDate);

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
                    style={[styles.button, styles.secondaryButton, styles.selectedDesignTitle]}
                    onPress={() => navigation.navigate('Gallery', {
                        selectMode: true,
                        multiple: true,
                        onSelect: (designs) => {
                            setSelectedDesigns(designs);
                        },
                        selectedDesigns: selectedDesigns
                    })}
                >
                    <Text style={[styles.buttonText, {color:theme.COLORS.primary }] }>Select Design from Gallery</Text>
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
                <TouchableOpacity onPress={() => openDateTimePicker('bookingDate')} style={[styles.dateInputButton, formData.bookingDate && { backgroundColor: theme.COLORS.lightPrimary }]}>
                    <Text style={styles.dateInputText}>{dayjs(formData.bookingDate).format('YYYY-MM-DD HH:mm')}</Text>
                </TouchableOpacity>
                
                <Text style={styles.dateLabel}>Delivery Date</Text>
                <TouchableOpacity onPress={() => openDateTimePicker('deliveryDate')} style={[styles.dateInputButton, formData.deliveryDate && { backgroundColor: theme.COLORS.lightPrimary }]}>
                    <Text style={styles.dateInputText}>{dayjs(formData.deliveryDate).format('YYYY-MM-DD HH:mm')}</Text>
                </TouchableOpacity>
                
                <Text style={styles.dateLabel}>Reminders</Text>
                {formData.reminderDates.map((reminder, index) => (
                    <View key={index} style={styles.reminderDateContainer}>
                        <TouchableOpacity onPress={() => openDateTimePicker('reminderDates', index)} style={[styles.dateInputButton, reminder.date && { backgroundColor: theme.COLORS.lightPrimary }]}>
                            <Text style={styles.dateInputText}>{dayjs(reminder.date).format('YYYY-MM-DD HH:mm')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            const newReminderDates = formData.reminderDates ? [...formData.reminderDates] : [];
                            newReminderDates.splice(index, 1);
                            handleInputChange('reminderDates', newReminderDates);
                        }} style={styles.removeReminderButton}>
                            <Ionicons name="trash-bin-outline" size={24} color={theme.COLORS.danger} />
                        </TouchableOpacity>
                    </View>
                ))}
                
                <TouchableOpacity onPress={() => openDateTimePicker('reminderDates')} style={styles.addReminderButton}>
                    <Ionicons name="add-circle-outline" size={24} color={theme.COLORS.primary} />
                    <Text style={styles.addReminderButtonText}>Add Reminder</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.button} onPress={handleSaveBooking}>
                    <Text style={styles.buttonText}>{booking ? 'Save Changes' : 'Add Booking'}</Text>
                </TouchableOpacity>
            </ScrollView>

            

            <Modal
                animationType="fade"
                transparent={true}
                visible={isDateTimePickerVisible}
                onRequestClose={() => setDateTimePickerVisible(false)}
            >
                <View style={styles.datePickerOverlay}>
                    <View style={styles.datePickerModalView}>
                        <DateTimePicker
                            mode="single"
                            timePicker={true}
                            date={tempSelectedDate.date}
                            onChange={onDateTimeChange}
                            is24Hour={true}
                            androidVariant="nativeAndroid"
                            maximumDate={dateTimePickerField === 'reminderDates' ? formData.deliveryDate : null}
                            minimumDate={dateTimePickerField === 'deliveryDate' ? formData.bookingDate : null}
                           

                            
                        />
                        <TouchableOpacity onPress={handleConfirmDateTime} style={styles.confirmButton}>
                            <Text style={styles.buttonText}>Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCancelDateTime} style={[styles.cancelButton, { marginTop: 10 }]}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
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
        fontWeight: 'bold',
        
    },
    pickerContainer: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        marginBottom: theme.SPACING.md,
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                height: 200,
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
        minWidth: '80%',
    },
    
    cancelButton: {
        marginTop: theme.SPACING.md,
        padding: theme.SPACING.sm,
        alignItems: 'center',
        backgroundColor: theme.COLORS.lightGray,
        borderRadius: theme.BORDERRADIUS.sm,
    },
    cancelButtonText: {
        color: theme.COLORS.textDark,
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.sm,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
        marginTop: theme.SPACING.md,
    },
    selectedDesignContainer: {
        alignItems: 'center',
        marginVertical: theme.SPACING.md,
        backgroundColor:'red',
        width:'100%'

    },
    selectedDesignTitle: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.sm,
        backgroundColor: theme.COLORS.darkPrimary
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
    reminderDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
    },
    removeReminderButton: {
        marginLeft: theme.SPACING.md,
    },
    addReminderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        backgroundColor: theme.COLORS.lightPrimary,
        marginBottom: theme.SPACING.md,
    },
    addReminderButtonText: {
        color: theme.COLORS.primary,
        fontWeight: 'bold',
        marginLeft: theme.SPACING.sm,
    },
    clientSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
    },
    clientSelectorText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
    },
});

export default AddBookingScreen;