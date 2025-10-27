// hooks/useHotspotLinks.ts
import { useCallback, useState } from "react";
import type { Item, Consultation } from "../services/types";
import { buildExtractedItems } from "../services/product/extract";
import { StaticCatalogProvider } from "../services/product/providers/static";
import { attachProducts } from "../services/product/attachProducts";
import { RECOMMENDATIONS_DISABLED } from "../utils/featureFlags";
// 서버 모드용 (준비되면 켜기)
// import { functions } from "../services/firebaseService";
// import { httpsCallable } from "firebase/functions";

type EnrichInput = {
  afterImageDescription?: string;
  items: Item[];
};

export function useHotspotLinks(opts?: { useServer?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const enrich = useCallback(
    async ({ afterImageDescription, items }: EnrichInput): Promise<Item[]> => {
      if (RECOMMENDATIONS_DISABLED) {
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const extracted = buildExtractedItems(afterImageDescription, items);

        // --- 로컬 모드 (기본) ---
        if (!opts?.useServer) {
          const out = await attachProducts(items, {
            extracted,
            providers: [StaticCatalogProvider],
          });
          return out;
        }

        // --- 서버 모드 (Functions 준비되면 주석 해제) ---
        // const call = httpsCallable(functions, "searchProducts");
        // const { data } = (await call({ hotspots: items, extracted })) as any;
        // return data.hotspots as Item[];

        return items;
      } catch (e) {
        setError(e);
        return items;
      } finally {
        setLoading(false);
      }
    },
    [opts?.useServer]
  );

  return { enrich, loading, error };
}

/** 편의 함수: Consultation 객체에서 바로 호출 */
export async function enrichConsultationItems(
  consultation: Pick<Consultation, "afterImageDescription" | "recommendedItems">,
  useServer = false
) {
  if (RECOMMENDATIONS_DISABLED) {
    return [];
  }

  const extracted = buildExtractedItems(
    consultation.afterImageDescription,
    consultation.recommendedItems ?? []
  );
  const out = await attachProducts(consultation.recommendedItems ?? [], {
    extracted,
    providers: [StaticCatalogProvider],
  });
  return out;
}
