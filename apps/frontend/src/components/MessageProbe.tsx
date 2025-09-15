// src/components/MessageProbe.tsx (SERVER component)
import {getTranslations} from "next-intl/server";

export default async function MessageProbe() {
  const t = await getTranslations();
  return (
    <div className="text-xs opacity-60">
      SERVER probe: {t("tiles.interview.title")}
    </div>
  );
}
