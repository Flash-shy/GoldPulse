import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Activity, TrendingDown, TrendingUp } from "lucide-react-native";

import {
  buildQuotesWebSocketUrl,
  defaultApiBase,
  fetchPriceHistory,
  type PriceHistoryRow,
  type QuoteMessage,
} from "@goldpulse/shared";

import { useQuoteWebSocket } from "../hooks/useQuoteWebSocket";
import { colors } from "../theme";

function rowToQuote(r: PriceHistoryRow): QuoteMessage {
  const mid = String(r.mid);
  return {
    type: "quote",
    symbol: r.symbol,
    mid,
    bid: r.bid != null ? String(r.bid) : mid,
    ask: r.ask != null ? String(r.ask) : mid,
    source: r.source,
    recorded_at: r.recorded_at,
  };
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function TradingScreen() {
  const insets = useSafeAreaInsets();
  const apiBase = process.env.EXPO_PUBLIC_API_BASE ?? defaultApiBase;
  const wsUrl = useMemo(
    () =>
      buildQuotesWebSocketUrl({
        apiBase,
        wsUrlOverride: process.env.EXPO_PUBLIC_WS_URL,
      }),
    [apiBase]
  );

  const { quote, status } = useQuoteWebSocket(wsUrl);
  const [ticks, setTicks] = useState<QuoteMessage[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [qty, setQty] = useState("0.1");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchPriceHistory({ baseUrl: apiBase, limit: 50 });
        if (cancelled) return;
        setTicks(rows.map(rowToQuote));
        setHistoryError(null);
      } catch (e) {
        if (!cancelled) {
          setHistoryError(e instanceof Error ? e.message : "加载失败");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  useEffect(() => {
    if (!quote) return;
    setTicks((prev) => [quote, ...prev].slice(0, 120));
  }, [quote]);

  const lastMid = quote ? parseFloat(quote.mid) : ticks[0] ? parseFloat(ticks[0].mid) : null;
  const bid = quote ? parseFloat(quote.bid) : ticks[0] ? parseFloat(ticks[0].bid) : null;
  const ask = quote ? parseFloat(quote.ask) : ticks[0] ? parseFloat(ticks[0].ask) : null;

  const onQuickTrade = useCallback(
    (side: "buy" | "sell") => {
      const q = parseFloat(qty);
      if (Number.isNaN(q) || q <= 0) {
        Alert.alert("数量无效", "请输入大于 0 的数量（盎司）");
        return;
      }
      if (lastMid == null) {
        Alert.alert("暂无价格", "请等待行情连接或检查 API 地址");
        return;
      }
      const label = side === "buy" ? "买入" : "卖出";
      Alert.alert(
        `市价${label}`,
        `${label} ${q} oz XAU/USD @ ${lastMid.toFixed(2)}\n（演示，未提交后端）`
      );
    },
    [qty, lastMid]
  );

  const renderTick: ListRenderItem<QuoteMessage> = useCallback(({ item }) => {
    const m = parseFloat(item.mid);
    return (
      <View style={styles.tickRow}>
        <Text style={styles.tickTime}>{formatTime(item.recorded_at)}</Text>
        <Text style={styles.tickMid}>{Number.isNaN(m) ? "—" : m.toFixed(2)}</Text>
        <Text style={styles.tickSrc} numberOfLines={1}>
          {item.source}
        </Text>
      </View>
    );
  }, []);

  const statusLabel =
    status === "open" ? "实时" : status === "connecting" ? "连接中" : status === "error" ? "异常" : "重连中";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity color={colors.amber} size={22} />
          <View>
            <Text style={styles.title}>GoldPulse</Text>
            <Text style={styles.subtitle}>XAU/USD</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: status === "open" ? colors.emerald : colors.red },
            ]}
          />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      {historyError ? (
        <Text style={styles.warn}>历史：{historyError}</Text>
      ) : null}

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>中间价</Text>
        <Text style={styles.priceBig}>
          {lastMid != null ? lastMid.toFixed(2) : "—.——"}
        </Text>
        <View style={styles.bidAskRow}>
          <View>
            <Text style={styles.baLabel}>Bid</Text>
            <Text style={[styles.baVal, { color: colors.emerald }]}>
              {bid != null ? bid.toFixed(2) : "—"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.baLabel}>Ask</Text>
            <Text style={[styles.baVal, { color: colors.red }]}>
              {ask != null ? ask.toFixed(2) : "—"}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>实时行情</Text>
      <FlatList
        data={ticks}
        keyExtractor={(item, index) => `${item.recorded_at}-${item.mid}-${index}`}
        renderItem={renderTick}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        initialNumToRender={24}
        maxToRenderPerBatch={16}
        windowSize={5}
        removeClippedSubviews
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.qtyLabel}>数量（盎司）</Text>
        <TextInput
          value={qty}
          onChangeText={setQty}
          keyboardType="decimal-pad"
          placeholder="0.1"
          placeholderTextColor={colors.dim}
          style={styles.input}
        />
        <View style={styles.actions}>
          <Pressable
            onPress={() => onQuickTrade("buy")}
            style={({ pressed }) => [styles.btnBuy, pressed && styles.btnPressed]}
          >
            <TrendingUp color="#0c0c0f" size={22} />
            <Text style={styles.btnBuyText}>买入</Text>
          </Pressable>
          <Pressable
            onPress={() => onQuickTrade("sell")}
            style={({ pressed }) => [styles.btnSell, pressed && styles.btnPressed]}
          >
            <TrendingDown color="#fef2f2" size={22} />
            <Text style={styles.btnSellText}>卖出</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>演示模式 · 与 Web 端风格一致 · 一键市价（未接后端撮合）</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.dim,
    fontSize: 12,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: colors.muted,
    fontSize: 12,
  },
  warn: {
    color: "#fbbf24",
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  priceCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  priceLabel: {
    color: colors.dim,
    fontSize: 12,
    marginBottom: 4,
  },
  priceBig: {
    color: colors.text,
    fontSize: 36,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  bidAskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  baLabel: {
    color: colors.dim,
    fontSize: 11,
  },
  baVal: {
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  list: {
    flex: 1,
    minHeight: 120,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 8,
  },
  tickTime: {
    width: 88,
    color: colors.dim,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  tickMid: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  tickSrc: {
    flex: 1,
    color: colors.dim,
    fontSize: 11,
    textAlign: "right",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.cardMuted,
  },
  qtyLabel: {
    color: colors.dim,
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: colors.card,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  btnBuy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.emerald,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnSell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.red,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnPressed: {
    opacity: 0.88,
  },
  btnBuyText: {
    color: "#0c0c0f",
    fontSize: 17,
    fontWeight: "700",
  },
  btnSellText: {
    color: "#fef2f2",
    fontSize: 17,
    fontWeight: "700",
  },
  hint: {
    color: colors.dim,
    fontSize: 10,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
