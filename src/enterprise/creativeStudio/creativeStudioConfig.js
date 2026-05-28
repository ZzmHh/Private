/** 图文 / 视频创意工作台 · 对齐鸿图 AI 聚合平台工具与表单 */

const IMAGE_MODELS = [
  { value: "gpt-image-2", label: "gpt-image-2" },
  { value: "grok-imagine-official", label: "grok-imagine（官方）" },
  { value: "grok-imagine", label: "grok-imagine（代理）" },
  { value: "nanobanana-pro", label: "nanobanana-pro" },
];

const IMAGE_RATIOS = [
  { value: "default", label: "按模型默认（主图为1:1）" },
  { value: "auto", label: "auto" },
  { value: "1:1", label: "1:1" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

const IMAGE_RESOLUTIONS = [
  { value: "1k", label: "1k" },
  { value: "2k", label: "2k" },
  { value: "4k", label: "4k" },
];

const VIDEO_ASPECT = [
  { value: "16:9", label: "16:9（横版）" },
  { value: "9:16", label: "9:16（竖版）" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

const FRAME_ASPECT = [
  { value: "2:3", label: "2:3（竖向）" },
  { value: "3:2", label: "3:2（横向）" },
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

const POLLING_FIELDS = [
  {
    key: "autoWait",
    label: "提交后自动等待结果",
    type: "select",
    options: [
      { value: "true", label: "是" },
      { value: "false", label: "否，仅返回 task_id" },
    ],
    default: "true",
  },
  { key: "pollInterval", label: "轮询间隔（秒）", type: "number", default: 5, min: 1 },
  { key: "pollMax", label: "最大轮询次数", type: "number", default: 120, min: 1 },
];

const ADVANCED_VIDEO_FIELDS = [
  { key: "service_tier", label: "service_tier", type: "text", default: "default" },
  { key: "execution_expires_after", label: "execution_expires_after（秒）", type: "number", default: 3600 },
  {
    key: "watermark",
    label: "watermark",
    type: "select",
    options: [
      { value: "false", label: "false" },
      { value: "true", label: "true" },
    ],
    default: "false",
  },
  {
    key: "return_last_frame",
    label: "return_last_frame",
    type: "select",
    options: [
      { value: "", label: "不传" },
      { value: "false", label: "false" },
      { value: "true", label: "true" },
    ],
    default: "",
  },
  {
    key: "generate_audio",
    label: "generate_audio",
    type: "select",
    options: [
      { value: "", label: "不传" },
      { value: "false", label: "false" },
      { value: "true", label: "true" },
    ],
    default: "",
  },
  {
    key: "draft",
    label: "draft",
    type: "select",
    options: [
      { value: "", label: "不传" },
      { value: "false", label: "false" },
      { value: "true", label: "true" },
    ],
    default: "",
  },
  {
    key: "camera_fixed",
    label: "camera_fixed",
    type: "select",
    options: [
      { value: "", label: "不传" },
      { value: "false", label: "false" },
      { value: "true", label: "true" },
    ],
    default: "",
  },
  { key: "seed", label: "seed", type: "number", placeholder: "可选" },
  { key: "frames", label: "frames", type: "number", placeholder: "可选" },
  { key: "safety_identifier", label: "safety_identifier", type: "text", placeholder: "可选" },
  { key: "callback_url", label: "callback_url", type: "text", placeholder: "https://example.com/callback" },
  {
    key: "tools",
    label: "tools（JSON，可选）",
    type: "textarea",
    rows: 2,
    placeholder: '例如：[{"type":"web_search"}]',
  },
];

function imageTool(id, name, desc, prompt) {
  return {
    id,
    name,
    desc,
    kind: "image",
    price: 0.3,
    submitLabel: "立即生成",
    downloadLabel: "下载图片",
    emptyPreview: "暂无数据",
    fields: [
      {
        key: "model",
        label: "模型",
        type: "select",
        options: IMAGE_MODELS,
        default: "gpt-image-2",
      },
      {
        key: "prompt",
        label: "提示词",
        type: "textarea",
        rows: 4,
        default: prompt,
        placeholder: prompt,
      },
      {
        key: "ratio",
        label: "图片比例",
        type: "select",
        options: IMAGE_RATIOS,
        default: "default",
      },
      {
        key: "resolution",
        label: "分辨率",
        type: "select",
        options: IMAGE_RESOLUTIONS,
        default: "1k",
      },
      {
        key: "refUrls",
        label: "参考图 URL（每行一个）",
        type: "textarea",
        rows: 2,
        placeholder: "每行一个公网 HTTPS 图片地址（可选）",
      },
      {
        key: "localFiles",
        label: "本地参考图（可多选）",
        type: "file",
        accept: "image/*",
        multiple: true,
      },
    ],
  };
}

export const creativeImageStudio = {
  id: "visual",
  brandTitle: "图文美化",
  brandSubtitle: "AI 图片工作台",
  groups: [
    {
      id: "image",
      label: "图片生成",
      defaultOpen: true,
      tools: [
        imageTool(
          "main-image",
          "主图生成",
          "基于AI生成淘宝商品主图，支持上传参考图。",
          "根据图1，生成淘宝用的商品主图，要求没有错别字，没有品牌名",
        ),
        imageTool(
          "product-replace",
          "商品替换",
          "基于AI替换图片中的商品，支持上传参考图。",
          "将图1中的商品替换为图2中的商品，保持光影与构图一致",
        ),
        imageTool(
          "text-translate",
          "图片文字翻译",
          "基于AI翻译图片中的文字为英文，支持上传参考图。",
          "将图片中的中文卖点翻译为英文，保持排版风格",
        ),
        imageTool(
          "poster",
          "宣传海报生成",
          "基于AI生成淘宝商品宣传海报，支持上传参考图。",
          "根据商品图生成促销海报，突出限时折扣与核心卖点",
        ),
        imageTool(
          "white-bg",
          "白底图",
          "基于AI生成商品白底图，支持上传参考图。",
          "生成纯白背景的商品主图，边缘干净无杂色",
        ),
        imageTool(
          "bg-replace",
          "背景替换",
          "基于AI替换商品图片背景，支持上传参考图。",
          "将商品背景替换为简约居家场景，商品主体不变",
        ),
        imageTool(
          "detail-image",
          "详情图生成",
          "基于AI生成淘宝商品详情图，支持上传参考图。",
          "生成详情页长图模块：卖点图标 + 参数表 + 使用场景",
        ),
      ],
    },
  ],
};

export const creativeVideoStudio = {
  id: "video",
  brandTitle: "AI 视频生成",
  brandSubtitle: "AI 视频工作台",
  groups: [
    {
      id: "video",
      label: "视频生成",
      defaultOpen: true,
      tools: [
        {
          id: "seedance2",
          name: "seedance2生视频",
          desc: "接入 doubao-seedance-2.0 的异步视频生成，支持参考图 URL 与本地上传。",
          kind: "video",
          price: 5,
          submitLabel: "提交生成",
          downloadLabel: "下载视频",
          emptyPreview: "暂无视频",
          fields: [
            {
              key: "prompt",
              label: "提示词（必填）",
              type: "textarea",
              rows: 3,
              required: true,
              placeholder: "例如：一只猫在海边奔跑，电影感，夕阳，4k",
            },
            {
              key: "model",
              label: "模型",
              type: "select",
              options: [{ value: "doubao-seedance-2.0", label: "doubao-seedance-2.0" }],
              default: "doubao-seedance-2.0",
            },
            {
              key: "ratio",
              label: "宽高比",
              type: "select",
              options: VIDEO_ASPECT,
              default: "16:9",
            },
            { key: "duration", label: "视频时长（秒）", type: "number", default: 5, min: 1, max: 60 },
            {
              key: "resolution",
              label: "分辨率",
              type: "select",
              options: [
                { value: "720p", label: "720p" },
                { value: "1080p", label: "1080p" },
              ],
              default: "720p",
            },
            {
              key: "localFiles",
              label: "本地参考图（可多选）",
              type: "file",
              accept: "image/*",
              multiple: true,
            },
            {
              key: "refUrls",
              label: "参考图 URL（每行一个）",
              type: "textarea",
              rows: 2,
              placeholder: "https://example.com/input.jpg",
            },
            { key: "_advanced", label: "高级参数（可选）", type: "collapsible", children: ADVANCED_VIDEO_FIELDS },
            { key: "_polling", label: "轮询设置（可选）", type: "collapsible", children: POLLING_FIELDS },
          ],
          taskQuery: true,
        },
        {
          id: "frame-video",
          name: "商品图首尾帧生视频",
          desc: "基于 grok_imagine 的视频生成，上传首帧和尾帧图片生成商品展示视频。",
          kind: "video",
          price: 0.6,
          submitLabel: "提交生成",
          downloadLabel: "下载视频",
          emptyPreview: "暂无视频",
          fields: [
            {
              key: "prompt",
              label: "提示词",
              type: "textarea",
              rows: 3,
              default: "图1为首帧，图2为尾帧，生成一个展示商品的视频",
              placeholder: "图1为首帧，图2为尾帧，生成一个展示商品的视频",
            },
            {
              key: "duration",
              label: "视频时长（秒）",
              type: "select",
              options: [
                { value: "6", label: "6" },
                { value: "10", label: "10" },
              ],
              default: "6",
            },
            {
              key: "ratio",
              label: "宽高比",
              type: "select",
              options: FRAME_ASPECT,
              default: "1:1",
            },
            {
              key: "localFiles",
              label: "首尾帧图片（可多选，建议上传两张）",
              type: "file",
              accept: "image/*",
              multiple: true,
            },
            {
              key: "refUrls",
              label: "首尾帧图片 URL（每行一个）",
              type: "textarea",
              rows: 2,
              placeholder: "https://example.com/first.jpg\nhttps://example.com/last.png",
            },
            { key: "_polling", label: "轮询设置（可选）", type: "collapsible", children: POLLING_FIELDS },
          ],
          taskQuery: true,
        },
        {
          id: "free-video",
          name: "自由视频生成",
          desc: "基于 grok_imagine 的视频生成，支持参考图 URL 与本地上传。",
          kind: "video",
          price: 1.2,
          submitLabel: "提交生成",
          downloadLabel: "下载视频",
          emptyPreview: "暂无视频",
          fields: [
            {
              key: "prompt",
              label: "提示词（必填）",
              type: "textarea",
              rows: 3,
              required: true,
              placeholder: "描述视频内容、镜头运动与风格",
            },
            {
              key: "model",
              label: "模型",
              type: "select",
              options: [
                { value: "grok-imagine", label: "grok-imagine（代理）" },
                { value: "grok-imagine-official", label: "grok-imagine（官方）" },
              ],
              default: "grok-imagine",
            },
            {
              key: "ratio",
              label: "宽高比",
              type: "select",
              options: VIDEO_ASPECT,
              default: "9:16",
            },
            { key: "duration", label: "视频时长（秒）", type: "number", default: 8, min: 1, max: 30 },
            {
              key: "localFiles",
              label: "本地参考图（可多选）",
              type: "file",
              accept: "image/*",
              multiple: true,
            },
            {
              key: "refUrls",
              label: "参考图 URL（每行一个）",
              type: "textarea",
              rows: 2,
              placeholder: "https://example.com/ref.jpg",
            },
            { key: "_polling", label: "轮询设置（可选）", type: "collapsible", children: POLLING_FIELDS },
          ],
          taskQuery: true,
        },
      ],
    },
  ],
};

export function getCreativeStudio(studioId) {
  if (studioId === "video") return creativeVideoStudio;
  return creativeImageStudio;
}

export function findCreativeTool(studio, toolId) {
  for (const group of studio.groups) {
    const hit = group.tools.find((t) => t.id === toolId);
    if (hit) return hit;
  }
  return studio.groups[0]?.tools[0] || null;
}

export function defaultCreativeToolId(studio) {
  return studio.groups[0]?.tools[0]?.id || "";
}

export function buildDefaultFormValues(tool) {
  const values = {};
  const walk = (fields) => {
    fields?.forEach((f) => {
      if (f.type === "collapsible") {
        walk(f.children);
        return;
      }
      if (f.type === "file") return;
      values[f.key] = f.default ?? "";
    });
  };
  walk(tool?.fields);
  return values;
}

export function flattenToolFields(tool) {
  const out = [];
  const walk = (fields) => {
    fields?.forEach((f) => {
      if (f.type === "collapsible") walk(f.children);
      else out.push(f);
    });
  };
  walk(tool?.fields);
  return out;
}

/** 演示用 mock 生成（后续可接真实 API） */
export function mockCreativeGenerate(tool, values, filePreviews = []) {
  const ts = Date.now();
  if (tool.kind === "image") {
    const seed = encodeURIComponent(tool.name);
    return {
      kind: "image",
      status: "completed",
      previewUrl: `https://picsum.photos/seed/${seed}-${ts}/800/800`,
      downloadUrl: `https://picsum.photos/seed/${seed}-${ts}/1080/1080`,
      log: {
        tool: tool.id,
        model: values.model,
        ratio: values.ratio,
        resolution: values.resolution,
        prompt: values.prompt,
        refUrls: values.refUrls,
        localFiles: filePreviews.map((f) => f.name),
        cost: tool.price,
        finishedAt: new Date().toISOString(),
      },
    };
  }

  const taskId = `task_${tool.id}_${ts}`;
  return {
    kind: "video",
    status: "completed",
    taskId,
    previewLabel: "视频已生成（演示）",
    downloadUrl: null,
    log: {
      tool: tool.id,
      taskId,
      prompt: values.prompt,
      model: values.model,
      ratio: values.ratio,
      duration: values.duration,
      resolution: values.resolution,
      refUrls: values.refUrls,
      localFiles: filePreviews.map((f) => f.name),
      autoWait: values.autoWait,
      cost: tool.price,
      finishedAt: new Date().toISOString(),
    },
  };
}
