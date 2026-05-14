import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { useResponsive } from '@/hooks/useResponsive';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ChevronLeft color={Colors.white} size={22} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termos de Uso</Text>
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

          <Text style={styles.section}>1. Aceitação dos termos</Text>
          <Text style={styles.paragraph}>
            Ao criar uma conta no VYBE, você concorda com estes Termos de Uso e com nossa Política de Privacidade.
            Se não concordar, não use o app.
          </Text>

          <Text style={styles.section}>2. Idade mínima</Text>
          <Text style={styles.paragraph}>
            O VYBE é destinado a maiores de 18 anos. Ao se cadastrar, você declara ter pelo menos essa idade.
            Detectamos contas falsas e podemos remover usuários menores de idade sem aviso prévio.
          </Text>

          <Text style={styles.section}>3. Conta de usuário</Text>
          <Text style={styles.paragraph}>
            Você é responsável por manter suas credenciais seguras. Não compartilhe sua senha. Notifique-nos
            imediatamente se suspeitar de acesso não autorizado à sua conta.
          </Text>

          <Text style={styles.section}>4. Conteúdo postado</Text>
          <Text style={styles.paragraph}>
            Você mantém os direitos sobre as fotos e textos que publica, mas concede ao VYBE uma licença
            não-exclusiva pra exibi-los dentro do app enquanto durarem (posts expiram em 2, 4 ou 6 horas).
            Você é responsável pelo conteúdo que publica.
          </Text>
          <Text style={styles.paragraph}>
            É proibido publicar conteúdo: ilegal, ofensivo, sexualmente explícito sem aviso, violento,
            que assedie outros usuários, faça discurso de ódio, viole propriedade intelectual ou
            represente fraude.
          </Text>

          <Text style={styles.section}>5. Moderação</Text>
          <Text style={styles.paragraph}>
            Podemos remover qualquer post, bloquear contas ou suspender o acesso a qualquer momento se
            entendermos que estes termos foram violados. Denúncias são analisadas em até 24 horas.
          </Text>

          <Text style={styles.section}>6. Localização</Text>
          <Text style={styles.paragraph}>
            O app usa sua localização pra mostrar o que está rolando perto de você e permitir check-ins.
            Você pode revogar permissão a qualquer momento nas configurações do seu celular — mas algumas
            features deixam de funcionar.
          </Text>

          <Text style={styles.section}>7. Pontos e recompensas</Text>
          <Text style={styles.paragraph}>
            Pontos do VYBE não têm valor monetário, não podem ser trocados por dinheiro nem transferidos
            entre contas. Podemos ajustar a regra de ganho/resgate de pontos a qualquer momento. Recompensas
            dependem de parceiros e podem mudar.
          </Text>

          <Text style={styles.section}>8. Comportamento esperado</Text>
          <Text style={styles.paragraph}>
            Trate outros usuários com respeito. Não use o app pra: stalking, ameaças, golpes financeiros,
            venda de produtos ilegais ou qualquer atividade criminosa. Violações resultam em banimento.
          </Text>

          <Text style={styles.section}>9. Disponibilidade do serviço</Text>
          <Text style={styles.paragraph}>
            Tentamos manter o app no ar 24/7, mas não garantimos disponibilidade total. Manutenções,
            problemas técnicos ou força maior podem causar interrupções.
          </Text>

          <Text style={styles.section}>10. Mudanças nestes termos</Text>
          <Text style={styles.paragraph}>
            Podemos atualizar estes termos. Mudanças significativas serão notificadas no app. Continuar
            usando após a notificação significa aceitar a nova versão.
          </Text>

          <Text style={styles.section}>11. Contato</Text>
          <Text style={styles.paragraph}>
            Dúvidas? Mande um email pra <Text style={styles.link}>contato@vybe.app.br</Text>.
          </Text>

          <Text style={styles.section}>12. Lei aplicável</Text>
          <Text style={styles.paragraph}>
            Estes termos são regidos pela lei brasileira. Foro: comarca de São Paulo/SP.
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
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.heading, fontSize: FontSize.lg, color: Colors.white,
  },
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
  link: { color: Colors.secondary },
});
