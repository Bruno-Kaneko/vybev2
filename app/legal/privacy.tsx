import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing } from '@/constants';
import { useResponsive } from '@/hooks/useResponsive';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ChevronLeft color={Colors.white} size={22} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: responsive.pagePadding, paddingBottom: insets.bottom + Spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.shell, { maxWidth: responsive.contentMaxWidth }]}>
          <Text style={styles.updated}>Última atualização: 14 de maio de 2026</Text>

          <Text style={styles.paragraph}>
            Esta política descreve quais dados coletamos, pra que servem, com quem compartilhamos e quais
            são seus direitos. Em conformidade com a LGPD (Lei Geral de Proteção de Dados).
          </Text>

          <Text style={styles.section}>1. Dados que coletamos</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Cadastro:</Text> email, nome de usuário, foto de perfil, bio.{'\n'}
            <Text style={styles.bold}>Localização:</Text> latitude/longitude do seu dispositivo, usadas pra
            mostrar o feed "Para Você" e validar check-ins. Não armazenamos histórico de localização.{'\n'}
            <Text style={styles.bold}>Posts e mídia:</Text> fotos que você publica e legendas. Posts expiram
            automaticamente em 2/4/6 horas; depois disso, são removidos dos servidores.{'\n'}
            <Text style={styles.bold}>Interações:</Text> reactions (curtir/fire), comentários, follows,
            mensagens diretas, denúncias.{'\n'}
            <Text style={styles.bold}>Dispositivo:</Text> versão do app, modelo do celular, sistema operacional,
            token de push notification (Expo).
          </Text>

          <Text style={styles.section}>2. Como usamos seus dados</Text>
          <Text style={styles.paragraph}>
            • Fazer o app funcionar (login, feed, mensagens){'\n'}
            • Mostrar conteúdo relevante baseado em localização{'\n'}
            • Permitir comunicação entre usuários{'\n'}
            • Detectar e remover comportamento abusivo{'\n'}
            • Enviar notificações push (com sua permissão){'\n'}
            • Melhorar o app analisando métricas anônimas de uso
          </Text>

          <Text style={styles.section}>3. Com quem compartilhamos</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Supabase</Text> — provedor de banco de dados onde seus dados ficam
            armazenados. Sediado nos EUA, com criptografia em trânsito e em repouso.{'\n'}
            <Text style={styles.bold}>Expo / EAS</Text> — entrega push notifications.{'\n'}
            <Text style={styles.bold}>Google Places API</Text> — usamos pra buscar estabelecimentos. Sua
            localização é enviada anonimamente.{'\n'}
            <Text style={styles.bold}>Autoridades</Text> — em caso de obrigação legal (intimação judicial,
            investigação criminal).{'\n'}
            <Text style={styles.bold}>NÃO vendemos seus dados</Text> para terceiros, anunciantes ou
            empresas de marketing.
          </Text>

          <Text style={styles.section}>4. Retenção de dados</Text>
          <Text style={styles.paragraph}>
            • Posts: removidos automaticamente após expirar (2/4/6h){'\n'}
            • Chats: chats individuais expiram em 8h{'\n'}
            • Dados de cadastro: mantidos enquanto sua conta existir{'\n'}
            • Logs técnicos: 30 dias{'\n'}
            • Conta excluída: dados pessoais apagados em até 30 dias
          </Text>

          <Text style={styles.section}>5. Seus direitos (LGPD)</Text>
          <Text style={styles.paragraph}>
            Você tem direito a:{'\n'}
            • Acessar seus dados{'\n'}
            • Corrigir dados incompletos ou desatualizados{'\n'}
            • Solicitar exclusão dos seus dados{'\n'}
            • Revogar consentimento a qualquer momento{'\n'}
            • Portabilidade dos dados pra outro serviço{'\n\n'}
            Pra exercer qualquer direito, mande email pra <Text style={styles.link}>privacidade@vybe.app.br</Text>.
            Respondemos em até 15 dias.
          </Text>

          <Text style={styles.section}>6. Segurança</Text>
          <Text style={styles.paragraph}>
            Usamos criptografia TLS em todas as conexões, hash de senhas (bcrypt) e Row Level Security no
            banco. Mesmo assim, nenhum sistema é 100% seguro. Em caso de incidente de segurança que
            afete seus dados, notificaremos você e a ANPD conforme a LGPD exige.
          </Text>

          <Text style={styles.section}>7. Cookies e tracking</Text>
          <Text style={styles.paragraph}>
            O app não usa cookies de terceiros pra rastreamento publicitário. Usamos apenas o necessário
            pra manter sua sessão logada e identificar seu dispositivo pra push notifications.
          </Text>

          <Text style={styles.section}>8. Crianças e adolescentes</Text>
          <Text style={styles.paragraph}>
            O VYBE é apenas para maiores de 18 anos. Não coletamos intencionalmente dados de menores.
            Se descobrirmos que um menor criou conta, removeremos imediatamente.
          </Text>

          <Text style={styles.section}>9. Mudanças nesta política</Text>
          <Text style={styles.paragraph}>
            Podemos atualizar esta política. Mudanças significativas serão notificadas no app com pelo
            menos 30 dias de antecedência.
          </Text>

          <Text style={styles.section}>10. Encarregado de proteção de dados</Text>
          <Text style={styles.paragraph}>
            Email: <Text style={styles.link}>privacidade@vybe.app.br</Text>{'\n'}
            Empresa responsável: VYBE App Ltda — São Paulo/SP
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.lg, color: Colors.white },
  content: { alignItems: 'center', paddingTop: Spacing.lg },
  shell: { width: '100%' },
  updated: {
    fontFamily: FontFamily.body, fontSize: FontSize.xs,
    color: Colors.textMuted, marginBottom: Spacing.xl,
  },
  section: {
    fontFamily: FontFamily.headingMedium, fontSize: FontSize.lg,
    color: Colors.white, marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  paragraph: {
    fontFamily: FontFamily.body, fontSize: FontSize.sm,
    color: Colors.text, lineHeight: FontSize.sm * 1.7,
    marginBottom: Spacing.sm,
  },
  bold: { fontFamily: FontFamily.bodySemiBold },
  link: { color: Colors.secondary },
});
