/**
 * Mentor Survey Script
 * - Test mode via ?mode=test
 * - Duration tracking
 * - Sends data to Google Sheets via GAS
 */

(function () {
  'use strict';

  // ========================================
  // 設定
  // ========================================
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzxtL8zwg_nbuIN-jc4vK3_upHom_uFCYTvh_f1QZJO3d-LletjItDZoK-cj5yZnSoL/exec';
  const SECRET_KEY = 'oDfmZdfZudNxmm4mVQ2Lvkj7Ofm4tH';

  const VALID_MENTORS = [
    '中村 ひろき', '杉本 至', '紫竹 佑騎', '小島 淳', '大谷 祐司',
    '山崎 拓也', '茂木 健一', '増渕 大輔', '本多 太一', '深野 彌',
    '平下 公洋', '中農 稔（ねろ）', '長峯 広雅', '佐野 健', '近藤 祥子',
    '小菅 達矢', '河畠 輝', '藤川 真一（えふしん）', '山本 憲', '和田 康宏',
    '森 豪基（もりご）', '橋本 正德', '大村 幸寛', '奥屋 孝太郎', '小川 博教'
  ];

  // ========================================
  // モード判定 & 所要時間計測開始
  // ========================================
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') === 'test' ? 'test' : 'prod';
  const t0 = performance.now();

  // ========================================
  // DOM Elements
  // ========================================
  const surveyForm = document.getElementById('survey-form');
  const thankYou = document.getElementById('thank-you');
  const thankYouNote = document.getElementById('thank-you-note');
  const testBanner = document.getElementById('test-banner');
  const q2Section = document.getElementById('q2-section');
  const wineStory = document.getElementById('wine-story');
  const charRemaining = document.getElementById('remaining');
  const submitBtn = document.getElementById('submit-btn');
  const mentorRadios = document.querySelectorAll('input[name="mentor"]');
  const wineRadios = document.querySelectorAll('input[name="wine"]');

  // ========================================
  // テストモード表示・設定
  // ========================================
  const mentorOptionsContainer = document.getElementById('mentor-options');
  const testSenderOption = document.getElementById('test-sender-option');

  if (mode === 'test') {
    // バナー表示
    if (testBanner) testBanner.style.display = 'block';

    // メンター選択をグレーアウト（表示するが選択不可）
    if (mentorOptionsContainer) {
      mentorOptionsContainer.classList.add('test-mode-disabled');
      mentorRadios.forEach(radio => {
        radio.disabled = true;
      });
    }

    // テスト送信者オプションを表示（リスト最後に追加済み）
    if (testSenderOption) testSenderOption.style.display = 'flex';
  }

  // ========================================
  // 既回答チェック（本番のみ）
  // ========================================
  if (mode === 'prod' && localStorage.getItem('mentorpoll_answered') === 'true') {
    surveyForm.style.display = 'none';
    thankYou.style.display = 'block';
    return;
  }

  // ========================================
  // State
  // ========================================
  let mentorSelected = mode === 'test' ? '(TEST) G\'s Office' : null;
  let wineSelected = null;
  let isSubmitting = false;

  function updateSubmitState() {
    const q2Required = wineSelected === 'A';
    const q2Valid = !q2Required || (wineStory && wineStory.value.trim().length > 0);
    submitBtn.disabled = !(mentorSelected && wineSelected && q2Valid);
  }

  // ========================================
  // Event Handlers
  // ========================================
  mentorRadios.forEach(radio => {
    radio.addEventListener('change', e => {
      // テストモードでは選択を無視
      if (mode !== 'test') {
        mentorSelected = e.target.value;
      }
      updateSubmitState();
    });
  });

  wineRadios.forEach(radio => {
    radio.addEventListener('change', e => {
      wineSelected = e.target.value;
      q2Section.style.display = wineSelected === 'A' ? 'block' : 'none';
      updateSubmitState();
    });
  });

  if (wineStory) {
    wineStory.addEventListener('input', () => {
      const remaining = 300 - wineStory.value.length;
      charRemaining.textContent = remaining;
      charRemaining.parentElement.style.color = remaining < 30 ? 'rgba(220,38,38,.9)' : '';
      updateSubmitState();
    });
  }

  // ========================================
  // Submit
  // ========================================
  async function submitToGAS(data) {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function showError() {
    submitBtn.textContent = '再送する';
    submitBtn.disabled = false;
    submitBtn.classList.add('btn-retry');
    isSubmitting = false;
  }

  submitBtn.addEventListener('click', async () => {
    if (isSubmitting || submitBtn.disabled) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';
    submitBtn.classList.remove('btn-retry');

    // 本番モードのみメンター名バリデーション
    if (mode !== 'test' && !VALID_MENTORS.includes(mentorSelected)) {
      alert('無効な選択です。ページを再読み込みしてください。');
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = '送信する';
      return;
    }

    const durationMs = Math.round(performance.now() - t0);
    const submitData = {
      secret: SECRET_KEY,
      mode: mode,
      mentor_name: mode === 'test' ? '(TEST) G\'s Office' : mentorSelected,
      q1_choice: wineSelected,
      q2_text: wineSelected === 'A' ? wineStory.value.trim() : '',
      duration_ms: durationMs,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      user_agent: navigator.userAgent
    };

    try {
      const result = await submitToGAS(submitData);

      if (result.success) {
        // 本番のみlocalStorage保存
        if (mode === 'prod') {
          localStorage.setItem('mentorpoll_answered', 'true');
        }

        // 完了画面表示
        surveyForm.style.display = 'none';
        thankYou.style.display = 'block';
        thankYou.classList.add('fade-in');

        // テストモードの場合は注記表示
        if (mode === 'test' && thankYouNote) {
          thankYouNote.style.display = 'block';
        }
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      showError();
    }
  });

  updateSubmitState();
})();
