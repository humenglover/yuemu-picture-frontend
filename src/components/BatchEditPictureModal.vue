<template>
  <div class="yuemu-batch-edit-picture-modal">
    <a-modal
      v-model:open="visible"
      :title="t('components.batchEdit.title')"
      :footer="false"
      @cancel="closeModal"
      class="yuemu-custom-modal"
      :width="500"
    >
      <div class="yuemu-modal-content">
        <a-typography-paragraph class="yuemu-tip-text"> {{ t('components.batchEdit.note') }} </a-typography-paragraph>

        <a-form
          name="formData"
          layout="vertical"
          :model="formData"
          @finish="handleSubmit"
          class="yuemu-edit-form"
        >
          <a-form-item name="category" :label="t('components.batchEdit.category')">
            <a-auto-complete
              v-model:value="formData.category"
              :placeholder="t('components.batchEdit.categoryPlaceholder')"
              :options="categoryOptions"
              allow-clear
              class="yuemu-custom-input"
            />
          </a-form-item>

          <a-form-item name="tags" :label="t('components.batchEdit.tags')">
            <a-select
              v-model:value="formData.tags"
              mode="tags"
              :placeholder="t('components.batchEdit.tagsPlaceholder')"
              :options="tagOptions"
              allow-clear
              class="yuemu-custom-select"
            />
          </a-form-item>

          <a-form-item name="nameRule" :label="t('components.batchEdit.nameRule')">
            <a-input
              v-model:value="formData.nameRule"
              :placeholder="t('components.batchEdit.nameRulePlaceholder')"
              allow-clear
              class="yuemu-custom-input"
            />
          </a-form-item>

          <a-form-item>
            <a-button type="primary" html-type="submit" class="yuemu-submit-button"> {{ t('components.batchEdit.submit') }} </a-button>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import {
  editPictureByBatchUsingPost,
  listPictureTagCategoryUsingGet,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  pictureList: API.PictureVO[]
  spaceId: number
  onSuccess: () => void
}

const props = withDefaults(defineProps<Props>(), {})

// 是否可见
const visible = ref(false)

// 打开弹窗
const openModal = () => {
  visible.value = true
}

// 关闭弹窗
const closeModal = () => {
  visible.value = false
}

// 暴露函数给父组件
defineExpose({
  openModal,
})

const formData = reactive<API.PictureEditByBatchRequest>({
  category: '',
  tags: [],
  nameRule: '',
})

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  if (!props.pictureList) {
    return
  }
  const res = await editPictureByBatchUsingPost({
    pictureIdList: props.pictureList.map((picture) => picture.id),
    spaceId: props.spaceId,
    ...values,
  })
  // 操作成功
  if (res.data.code === 0 && res.data.data) {
    closeModal()
    props.onSuccess?.()
  } else {
    message.error(t('components.batchEdit.opFailed') + res.data.message)
  }
}

const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])

/**
 * 获取标签和分类选项
 */
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagOptions.value = (res.data.data.tagList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
    categoryOptions.value = (res.data.data.categoryList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
  } else {
    message.error(t('components.batchEdit.fetchFailed') + res.data.message)
  }
}

onMounted(() => {
  getTagCategoryOptions()
})
</script>

<style scoped>
.yuemu-custom-modal {
  :deep(.ant-modal-content) {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.ant-modal-header) {
    padding: 16px 24px;
    margin: 0;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.ant-modal-body) {
    padding: 24px;
  }

  :deep(.ant-modal-close) {
    top: 16px;
  }
}

.yuemu-modal-content {
  .yuemu-tip-text {
    color: #94a3b8;
    font-size: 13px;
    margin-bottom: 20px;
  }
}

.yuemu-edit-form {
  :deep(.ant-form-item-label) {
    padding-bottom: 8px;

    label {
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
    }
  }

  .yuemu-custom-input {
    :deep(.ant-input),
    :deep(.ant-input-affix-wrapper) {
      border-radius: 8px;
      border-color: #e2e8f0;
      padding: 8px 12px;
      transition: all 0.3s ease;

      &:hover,
      &:focus {
        border-color: #ff8e53;
        box-shadow: 0 0 0 2px rgba(255, 142, 83, 0.1);
      }
    }
  }

  .yuemu-custom-select {
    :deep(.ant-select-selector) {
      border-radius: 8px !important;
      border-color: #e2e8f0 !important;
      padding: 4px 12px !important;
      min-height: 40px;
    }

    :deep(.ant-select:not(.ant-select-disabled)):hover .ant-select-selector {
      border-color: #ff8e53 !important;
    }

    :deep(
      .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input)
        .ant-select-selector
    ) {
      border-color: #ff8e53 !important;
      box-shadow: 0 0 0 2px rgba(255, 142, 83, 0.1) !important;
    }

    :deep(.ant-select-selection-item) {
      background: #fff6f3;
      border-color: #ffb071;
      color: #ff8e53;
    }
  }

  .yuemu-submit-button {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    background: linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%);
    border: none;
    font-weight: 500;
    box-shadow: 0 2px 6px rgba(255, 107, 107, 0.2);
    transition: all 0.3s ease;
    margin-top: 8px;
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
      color: white;
      opacity: 0.9;
    }

    &:active {
      transform: translateY(1px);
    }
  }
}

@media screen and (max-width: 768px) {
  .yuemu-edit-form {
    :deep(.ant-form-item-label) label {
      font-size: 13px;
    }

    .yuemu-submit-button {
      height: 36px;
    }
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-submit-button:active, .yuemu-submit-button:hover,
  .yuemu-submit-button:active *, .yuemu-submit-button:hover *,
  .yuemu-custom-input:active, .yuemu-custom-input:hover,
  .yuemu-custom-input:active *, .yuemu-custom-input:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover * {
    transform: none !important;
  }
}
</style>
