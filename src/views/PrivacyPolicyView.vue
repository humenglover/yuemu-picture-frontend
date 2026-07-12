<template>
  <div id="PrivacyPolicyView">
    <div class="policy-container">
      <div class="policy-header">
        <h1 class="policy-title">{{ $t('pages.privacyPage.policy.title') }}</h1>
        <p class="policy-date">{{ $t('pages.privacyPage.policy.lastUpdated') }}</p>
      </div>
      
      <div class="policy-content">
        <p>{{ $t('pages.privacyPage.policy.intro1') }}</p>
        <p>{{ $t('pages.privacyPage.policy.intro2') }}</p>
        <p>{{ $t('pages.privacyPage.policy.intro3') }}</p>
        <hr />
        
        <div class="policy-section" id="privacy-policy">
          <h2>{{ $t('pages.privacyPage.policy.s1.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s1.desc') }}</p>
          
          <h3>{{ $t('pages.privacyPage.policy.s1.sub1Title') }}</h3>
          <p>{{ $t('pages.privacyPage.policy.s1.sub1Desc') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s1.sub1Items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s1.sub1Note') }}</p>
          
          <h3>{{ $t('pages.privacyPage.policy.s1.sub2Title') }}</h3>
          <p>{{ $t('pages.privacyPage.policy.s1.sub2Desc') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s1.sub2Items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s1.sub2Note') }}</p>
          
          <h3>{{ $t('pages.privacyPage.policy.s1.sub3Title') }}</h3>
          <p>{{ $t('pages.privacyPage.policy.s1.sub3Desc') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s1.sub3Items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s1.sub3Note') }}</p>
        </div>
        <hr />
        
        <div class="policy-section">
          <h2>{{ $t('pages.privacyPage.policy.s2.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s2.desc') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s2.items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s2.note') }}</p>
        </div>
        <hr />
        
        <div class="policy-section" id="cookies">
          <h2>{{ $t('pages.privacyPage.policy.s3.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s3.desc') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s3.items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s3.note') }}</p>
        </div>
        <hr />
        
        <div class="policy-section" id="ai-processing">
          <h2>{{ $t('pages.privacyPage.policy.s4.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s4.desc') }}</p>
          <p>{{ $t('pages.privacyPage.policy.s4.desc2') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s4.items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s4.note1') }}</p>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s4.note2') }}</p>
        </div>
        <hr />
        
        <div class="policy-section">
          <h2>{{ $t('pages.privacyPage.policy.s5.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s5.desc') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s5.items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s5.note') }}</p>
        </div>
        <hr />
        
        <div class="policy-section" id="third-party">
          <h2>{{ $t('pages.privacyPage.policy.s6.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s6.desc1') }}</p>
          <p>{{ $t('pages.privacyPage.policy.s6.desc2') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s6.items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s6.note') }}</p>
        </div>
        <hr />
        
        <div class="policy-section" id="your-rights">
          <h2>{{ $t('pages.privacyPage.policy.s7.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s7.desc') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s7.items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s7.note') }}</p>
        </div>
        <hr />
        
        <div class="policy-section">
          <h2>{{ $t('pages.privacyPage.policy.s8.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s8.desc1') }}</p>
          <p>{{ $t('pages.privacyPage.policy.s8.desc2') }}</p>
        </div>
        <hr />
        
        <div class="policy-section">
          <h2>{{ $t('pages.privacyPage.policy.s9.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s9.desc') }}</p>
          <ul>
            <li v-for="(item, index) in getArray('pages.privacyPage.policy.s9.items')" :key="index">{{ item }}</li>
          </ul>
          <p class="policy-note">{{ $t('pages.privacyPage.policy.s9.note') }}</p>
        </div>
        <hr />
        
        <div class="policy-section">
          <h2>{{ $t('pages.privacyPage.policy.s10.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s10.desc1') }}</p>
          <p>{{ $t('pages.privacyPage.policy.s10.desc2') }}</p>
        </div>
        <hr />
        
        <div class="policy-section">
          <h2>{{ $t('pages.privacyPage.policy.s11.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s11.desc1') }}</p>
          <p>{{ $t('pages.privacyPage.policy.s11.desc2') }}</p>
        </div>
        <hr />
        
        <div class="policy-section">
          <h2>{{ $t('pages.privacyPage.policy.s12.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s12.desc1') }}</p>
          <p>{{ $t('pages.privacyPage.policy.s12.desc2') }}</p>
          <p>{{ $t('pages.privacyPage.policy.s12.desc3') }}</p>
        </div>
        <hr />
        
        <div class="policy-section">
          <h2>{{ $t('pages.privacyPage.policy.s13.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.s13.desc1') }}</p>
        </div>
        <hr />
        
        <div class="policy-footer">
          <h2>{{ $t('pages.privacyPage.policy.footer.title') }}</h2>
          <p>{{ $t('pages.privacyPage.policy.footer.desc1') }}</p>
          <p>{{ $t('pages.privacyPage.policy.footer.desc2') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { tm, rt } = useI18n()

// getArray to map messages from tm
const getArray = (key: string) => {
  const messages = tm(key)
  if (Array.isArray(messages)) {
    return messages.map(msg => rt(msg))
  }
  return []
}
</script>

<style scoped>
#PrivacyPolicyView {
  min-height: 100vh;
  background: var(--background);
  color: var(--text-primary);
  padding: 40px 20px;
  font-family: var(--font-family-base);
  line-height: 1.6;
}

.policy-container {
  max-width: 800px;
  margin: 0 auto;
  background: var(--card-background);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 16px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.policy-header {
  margin-bottom: 32px;
}

.policy-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.policy-date {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.policy-content p {
  margin-bottom: 16px;
  font-size: 15px;
}

hr {
  border: 0;
  height: 1px;
  background: var(--border-color);
  margin: 32px 0;
}

.policy-section h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.policy-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 12px;
  color: var(--text-primary);
}

.policy-section ul {
  list-style-type: disc;
  padding-left: 24px;
  margin-bottom: 16px;
}

.policy-section li {
  margin-bottom: 8px;
  font-size: 15px;
}

.policy-note {
  font-size: 14px;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 8px;
}

.policy-footer {
  text-align: center;
  padding: 24px 0;
}

.policy-footer h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .policy-container {
    padding: 24px;
  }
  .policy-title {
    font-size: 28px;
  }
  .policy-section h2 {
    font-size: 20px;
  }
}
</style>
