import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { CATEGORIES } from '@/constants/mockData';
import { Category } from '@/constants/types';
import { useApp } from '@/context/AppContext';

function SettingRow({
  icon, label, value, onPress, danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.settingIconBg, danger && styles.settingIconBgDanger]}>
        <Ionicons name={icon} size={16} color={danger ? Colors.bearish : Colors.accent} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { subscription, upgradeToPro, downgradeToFree, activeCategories, toggleCategory, user, logout } = useApp();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  function handleUpgrade() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (subscription === 'pro') {
      downgradeToFree();
    } else {
      setShowUpgradeModal(true);
    }
  }

  function handleSignOut() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  function getInitials(name: string) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Preferences & account</Text>
      </View>

      {user ? (
        <View style={styles.accountCard}>
          <View style={styles.accountLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{user.name}</Text>
              <Text style={styles.accountEmail}>{user.email}</Text>
            </View>
          </View>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="log-out-outline" size={16} color={Colors.bearish} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          style={({ pressed }) => [styles.signInCard, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.signInLeft}>
            <View style={styles.signInIconBg}>
              <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.signInTitle}>Sign in or Create Account</Text>
              <Text style={styles.signInSubtitle}>Save preferences & sync across devices</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
      )}

      <View style={[styles.planCard, subscription === 'pro' && styles.planCardPro]}>
        <View style={styles.planLeft}>
          <View style={[styles.planIconBg, subscription === 'pro' && styles.planIconBgPro]}>
            <Ionicons name={subscription === 'pro' ? 'star' : 'person'} size={20}
              color={subscription === 'pro' ? Colors.pro : Colors.textSecondary} />
          </View>
          <View>
            <Text style={styles.planTitle}>
              {subscription === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </Text>
            <Text style={styles.planSubtitle}>
              {subscription === 'pro' ? '$10/month · Unlimited assets' : '2 asset limit'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleUpgrade}
          style={({ pressed }) => [
            styles.planBtn,
            subscription === 'pro' && styles.planBtnActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.planBtnText, subscription === 'pro' && styles.planBtnTextActive]}>
            {subscription === 'pro' ? 'Manage' : 'Upgrade'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MARKETS & FEED</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconBg}>
              <Ionicons name="funnel" size={16} color={Colors.accent} />
            </View>
            <Text style={styles.settingLabel}>Active Categories</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.categoryToggles}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategories.includes(cat.key as Category);
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleCategory(cat.key as Category);
                  }}
                  style={[styles.catToggle, isActive && styles.catToggleActive]}
                >
                  <Text style={[styles.catToggleText, isActive && styles.catToggleTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APP</Text>
        <View style={styles.card}>
          <SettingRow icon="information-circle" label="App Version" value="1.0.0" />
          <View style={styles.rowDivider} />
          <SettingRow icon="document-text" label="Terms of Service" />
          <View style={styles.rowDivider} />
          <SettingRow icon="shield-checkmark" label="Privacy Policy" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <SettingRow icon="globe" label="Data Sources" value="Mock API" />
          <View style={styles.rowDivider} />
          <SettingRow icon="time" label="Update Frequency" value="Real-time" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.card}>
          <SettingRow icon="chatbubble" label="Contact Support" />
          <View style={styles.rowDivider} />
          <SettingRow icon="star" label="Rate Just Trading" />
        </View>
      </View>

      <View style={styles.brandRow}>
        <Ionicons name="trending-up" size={16} color={Colors.accent} />
        <Text style={styles.brandText}>Just Trading</Text>
      </View>

      <Modal visible={showUpgradeModal} transparent animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.upgradeSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.upgradeIconRow}>
              <View style={styles.upgradeIconBg}>
                <Ionicons name="star" size={28} color={Colors.pro} />
              </View>
            </View>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeSubtitle}>Full access to all features</Text>
            <View style={styles.featuresList}>
              {[
                'Unlimited tracked assets',
                'Advanced filtering',
                'Priority alerts',
                'No restrictions ever',
              ].map(f => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.bullish} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => { upgradeToPro(); setShowUpgradeModal(false); }}
              style={styles.upgradeBtn}
            >
              <Text style={styles.upgradeBtnText}>Upgrade — $10/month</Text>
            </Pressable>
            <Pressable onPress={() => setShowUpgradeModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Maybe later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { gap: 0 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  accountCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  accountLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.accentDimBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.accent },
  accountInfo: { flex: 1, gap: 2 },
  accountName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  accountEmail: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  signOutBtn: { padding: 8 },
  signInCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  signInLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  signInIconBg: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  signInTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 2 },
  signInSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  planCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 24,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  planCardPro: { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.05)' },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIconBg: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  planIconBgPro: { backgroundColor: Colors.proDim },
  planTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  planSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  planBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.accentDimBorder,
  },
  planBtnActive: { backgroundColor: Colors.proDim, borderColor: 'rgba(255,215,0,0.3)' },
  planBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.accent },
  planBtnTextActive: { color: Colors.pro },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  settingIconBg: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  settingIconBgDanger: { backgroundColor: Colors.bearishDim },
  settingLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  settingLabelDanger: { color: Colors.bearish },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  rowDivider: { height: 1, backgroundColor: Colors.separator, marginLeft: 60 },
  categoryToggles: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16,
  },
  catToggle: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.backgroundTertiary, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  catToggleActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  catToggleText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  catToggleTextActive: { color: Colors.accent, fontFamily: 'Inter_600SemiBold' },
  brandRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 16,
  },
  brandText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  upgradeSheet: {
    backgroundColor: Colors.backgroundSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 24, alignItems: 'center',
  },
  upgradeIconRow: { marginBottom: 16 },
  upgradeIconBg: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.proDim, alignItems: 'center', justifyContent: 'center' },
  upgradeTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 6 },
  upgradeSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  featuresList: { width: '100%', gap: 12, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  upgradeBtn: {
    width: '100%', backgroundColor: Colors.pro, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10,
  },
  upgradeBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.black },
  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
