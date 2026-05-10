import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { colors, typography } from '@/theme/tokens';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';

export default function Quotes() {
  const { locale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });

  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    // Submit quote logic here
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('quotes.newQuote')}</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('quotes.projectName')}</Text>
        <TextInput
          style={styles.input}
          value={projectName}
          onChangeText={setProjectName}
          placeholder={t('quotes.projectName')}
          placeholderTextColor={colors.ink400}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('quotes.location')}</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder={t('quotes.location')}
          placeholderTextColor={colors.ink400}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('quotes.startDate')}</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.ink400}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('quotes.endDate')}</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.ink400}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{t('quotes.submit')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cloud },
  content: { padding: 16, paddingTop: 60 },
  title: { ...typography.xl, fontWeight: 'bold', color: colors.navy, marginBottom: 24 },
  formGroup: { marginBottom: 16 },
  label: { ...typography.sm, fontWeight: '600', color: colors.navy, marginBottom: 8 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.stone,
    borderRadius: 8,
    padding: 12,
    ...typography.md,
    color: colors.navy,
  },
  button: {
    backgroundColor: colors.gold,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { ...typography.md, fontWeight: 'bold', color: colors.navy },
});
