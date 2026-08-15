import React, { useEffect, useMemo, useState } from "react";
import { HelpCircle, Check, X, ArrowRight } from "lucide-react";
import { addCommerceTags } from "../../Api/Api";
import styles from "./OnboardingQuestionnaire.module.css";
import { ONBOARDING_QUESTIONS } from "./onboarding.constants";

const storageKey = (businessId) => `dq_onboarding_${businessId}`;

const loadLocalAnswers = (businessId) => {
  try {
    const raw = localStorage.getItem(storageKey(businessId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLocalAnswers = (businessId, answers) => {
  try {
    localStorage.setItem(storageKey(businessId), JSON.stringify(answers));
  } catch {
    /* localStorage no disponible */
  }
};

const OnboardingQuestionnaire = ({ businessId, tags = [], onTagsUpdate }) => {
  const [answers, setAnswers] = useState({});
  const [dismissed, setDismissed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  const existingTagNames = useMemo(
    () => new Set((tags || []).map((t) => t.nameTag)),
    [tags]
  );

  useEffect(() => {
    if (!businessId) return;
    const local = loadLocalAnswers(businessId);
    let changed = false;
    ONBOARDING_QUESTIONS.forEach((q) => {
      if (local[q.id] === undefined && existingTagNames.has(q.tagName)) {
        local[q.id] = true;
        changed = true;
      }
    });
    if (changed) saveLocalAnswers(businessId, local);
    setAnswers(local);
    setDismissed(false);
  }, [businessId, existingTagNames]);

  const pending = ONBOARDING_QUESTIONS.filter((q) => answers[q.id] === undefined);

  if (!businessId || pending.length === 0 || dismissed) return null;

  const current = pending[0];
  const answeredCount = ONBOARDING_QUESTIONS.length - pending.length;

  const handleAnswer = async (value) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    saveLocalAnswers(businessId, next);
    setSyncError("");

    if (value) {
      setSyncing(true);
      try {
        await addCommerceTags(businessId, [current.tagName]);
        onTagsUpdate?.([...(tags || []), { nameTag: current.tagName, type: "DESCRIPTIVE" }]);
      } catch {
        setSyncError("No pudimos guardar esta respuesta en el servidor. Se guardó en este dispositivo.");
      } finally {
        setSyncing(false);
      }
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <HelpCircle size={20} />
        </div>
        <div>
          <h3 className={styles.title}>Te ayudamos a que te encuentren más fácil</h3>
          <p className={styles.subtitle}>Respondé estas preguntas rápidas de sí o no</p>
        </div>
      </div>

      <div className={styles.progressRow}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(answeredCount / ONBOARDING_QUESTIONS.length) * 100}%` }}
          />
        </div>
        <span className={styles.progressLabel}>
          {answeredCount} de {ONBOARDING_QUESTIONS.length}
        </span>
      </div>

      <p className={styles.question}>{current.question}</p>

      {syncError && <p className={styles.syncError}>{syncError}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.answerBtn} ${styles.answerNo}`}
          onClick={() => handleAnswer(false)}
          disabled={syncing}
        >
          <X size={18} /> No
        </button>
        <button
          type="button"
          className={`${styles.answerBtn} ${styles.answerYes}`}
          onClick={() => handleAnswer(true)}
          disabled={syncing}
        >
          <Check size={18} /> Sí
        </button>
      </div>

      <button type="button" className={styles.skipLink} onClick={() => setDismissed(true)}>
        Ahora no <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default OnboardingQuestionnaire;