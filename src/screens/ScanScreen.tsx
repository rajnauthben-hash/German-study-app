import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Alert, Image, StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { extractTextFromImage } from '../services/ocrService';
import { generateStudySetFromText } from '../services/aiStudyGenerator';
import { saveStudySet, saveWorksheet, getUserProgress, saveUserProgress } from '../services/storageService';
import LoadingOverlay from '../components/LoadingOverlay';

type Nav = StackNavigationProp<RootStackParamList>;

type Step = 'capture' | 'extracting' | 'edit-text' | 'generating' | 'done';

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<Step>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');

  const requestPermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to scan worksheets.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required to upload worksheets.');
        return false;
      }
    }
    return true;
  };

  const handleCamera = async () => {
    if (!(await requestPermission('camera'))) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    if (!(await requestPermission('gallery'))) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setStep('extracting');
    setLoadingMsg('Reading your worksheet…');

    const ocrResult = await extractTextFromImage(uri);

    if (ocrResult.success && ocrResult.text) {
      setExtractedText(ocrResult.text);
    } else {
      // OCR not connected — let user enter text manually
      setExtractedText('');
    }

    // Save worksheet record
    await saveWorksheet({
      id: `ws-${Date.now()}`,
      imageUri: uri,
      extractedText: ocrResult.text,
      createdAt: new Date().toISOString(),
    });

    setStep('edit-text');
  };

  const handleGenerateStudySet = async () => {
    if (!extractedText.trim()) {
      Alert.alert('No text', 'Please paste or type the worksheet text before generating a study set.');
      return;
    }

    setStep('generating');
    setLoadingMsg('Analyzing your worksheet…');

    setTimeout(() => setLoadingMsg('Creating your study set…'), 1500);

    const result = await generateStudySetFromText(extractedText, imageUri ?? undefined);

    if (!result.success || !result.studySet) {
      Alert.alert('Error', result.error ?? 'Something went wrong. Please try again.');
      setStep('edit-text');
      return;
    }

    await saveStudySet(result.studySet);

    // Update worksheets scanned count
    const progress = await getUserProgress();
    await saveUserProgress({
      ...progress,
      totalWorksheetsScanned: progress.totalWorksheetsScanned + 1,
    });

    setStep('done');
    navigation.navigate('StudySet', { studySetId: result.studySet.id });

    // Reset for next scan
    setTimeout(() => {
      setStep('capture');
      setImageUri(null);
      setExtractedText('');
    }, 500);
  };

  const handleReset = () => {
    setStep('capture');
    setImageUri(null);
    setExtractedText('');
  };

  const isLoading = step === 'extracting' || step === 'generating';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {isLoading && <LoadingOverlay message={loadingMsg} subMessage="This may take a few seconds…" />}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Worksheet</Text>
          <Text style={styles.subtitle}>Take a photo or upload your German worksheet</Text>
        </View>

        {/* Image preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            <TouchableOpacity style={styles.changeBtn} onPress={handleReset}>
              <Text style={styles.changeBtnText}>✕ Change photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step: Capture */}
        {step === 'capture' && (
          <View>
            <TouchableOpacity style={[styles.bigBtn, { backgroundColor: Colors.primary }]} onPress={handleCamera} activeOpacity={0.85}>
              <Text style={styles.bigBtnIcon}>📷</Text>
              <Text style={styles.bigBtnLabel}>Take a Photo</Text>
              <Text style={styles.bigBtnSub}>Point your camera at the worksheet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.bigBtn, { backgroundColor: Colors.secondary }]} onPress={handleGallery} activeOpacity={0.85}>
              <Text style={styles.bigBtnIcon}>🖼️</Text>
              <Text style={styles.bigBtnLabel}>Upload from Gallery</Text>
              <Text style={styles.bigBtnSub}>Choose an existing photo</Text>
            </TouchableOpacity>

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>📌 Tips for best results</Text>
              <Text style={styles.tipItem}>• Make sure the worksheet is flat and well-lit</Text>
              <Text style={styles.tipItem}>• Capture the full page in frame</Text>
              <Text style={styles.tipItem}>• Avoid shadows and blurriness</Text>
              <Text style={styles.tipItem}>• You can edit the text after scanning</Text>
            </View>
          </View>
        )}

        {/* Step: Edit/Enter Text */}
        {step === 'edit-text' && (
          <View>
            <View style={styles.ocrNotice}>
              <Text style={styles.ocrNoticeIcon}>💡</Text>
              <View style={styles.ocrNoticeText}>
                <Text style={styles.ocrNoticeTitle}>
                  {extractedText ? 'Text extracted! Review and edit.' : 'OCR not connected yet'}
                </Text>
                <Text style={styles.ocrNoticeSub}>
                  {extractedText
                    ? 'Fix any errors the scanner made before generating your study set.'
                    : 'Paste or type the worksheet text below. Connect an OCR API for automatic extraction.'}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Worksheet Text</Text>
            <TextInput
              style={styles.textInput}
              value={extractedText}
              onChangeText={setExtractedText}
              placeholder="Paste or type the German worksheet text here…

Example:
Modal verbs: können, müssen, dürfen
Ich kann Deutsch sprechen.
Du musst lernen."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.charCount}>{extractedText.length} characters</Text>

            <TouchableOpacity
              style={[styles.generateBtn, !extractedText.trim() && styles.generateBtnDisabled]}
              onPress={handleGenerateStudySet}
              disabled={!extractedText.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.generateBtnText}>✨ Generate Study Activities</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleReset}>
              <Text style={styles.cancelBtnText}>Start over</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
  },
  imageContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.border,
  },
  changeBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.sm,
    alignItems: 'center',
  },
  changeBtnText: { color: '#fff', fontSize: Typography.fontSizeSM },
  bigBtn: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  bigBtnIcon: { fontSize: 36, marginBottom: Spacing.sm },
  bigBtnLabel: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
    marginBottom: 4,
  },
  bigBtnSub: {
    fontSize: Typography.fontSizeSM,
    color: 'rgba(255,255,255,0.8)',
  },
  tipBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  tipTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  ocrNotice: {
    flexDirection: 'row',
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  ocrNoticeIcon: { fontSize: 20, marginRight: Spacing.sm },
  ocrNoticeText: { flex: 1 },
  ocrNoticeTitle: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  ocrNoticeSub: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
  },
  inputLabel: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontSize: Typography.fontSizeMD,
    color: Colors.text,
    minHeight: 200,
    lineHeight: 22,
    ...Shadows.small,
  },
  charCount: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  generateBtnDisabled: {
    backgroundColor: Colors.textLight,
  },
  generateBtnText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  cancelBtn: {
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  cancelBtnText: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textLight,
  },
});
