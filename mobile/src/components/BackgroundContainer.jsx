import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { theme } from '../styles/theme';

const BackgroundContainer = ({ children }) => {
    return (
        <ImageBackground source={require('../../assets/bg.jpg')} style={styles.background}>
            <View style={styles.overlay}>
                {children}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: theme.COLORS.primaryLight,
        justifyContent: 'center',
        padding: theme.SPACING.xs,
    },
});

export default BackgroundContainer;
