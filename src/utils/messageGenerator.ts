export type PetState = "normal" | "happy" | "tired" | "warning" | "sleeping" | "focusing" | "dragging" | "eating" | "peeking";
export type MessageContext = "posture" | "rest" | "task_reminder" | "task_completed" | "idle" | "focus" | "petting" | "feeding" | "night";

const messages: Record<MessageContext, string[]> = {
  posture: [
    "看看远处吧喵",
    "眼睛休息一下？",
    "脖子酸不酸？",
    "伸个懒腰吧喵",
    "别离屏幕太近啦",
  ],
  rest: [
    "你是不是又不动了？",
    "我都替你腰疼了喵",
    "起来走两步？",
    "喝口水去吧",
    "休息5分钟吧",
  ],
  task_reminder: [
    "这个还没做呢",
    "别忘了这个哦喵",
    "任务快到期啦！",
    "还有事没做完呢",
    "记得清空待办哦",
  ],
  task_completed: [
    "不错嘛喵！",
    "干得漂亮",
    "又解决一个！",
    "太棒啦喵",
    "继续保持哦",
  ],
  idle: [
    "人呢？",
    "去哪玩了喵？",
    "发呆中...",
    "我睡着了...",
    "呼噜噜...",
  ],
  focus: [
    "认真工作最帅了",
    "加油加油喵！",
    "专注力满分",
    "别太累着自己",
    "我在陪着你哦",
  ],
  petting: [
    "呼噜噜...好舒服喵~",
    "再摸摸~",
    "最喜欢主人了喵！",
    "蹭蹭~",
    "喵呜~"
  ],
  feeding: [
    "吧唧吧唧...好吃喵！",
    "谢谢主人的投喂~",
    "吃饱了才有力气陪伴喵！",
    "这是什么好吃的？",
    "啊呜一口吞掉！"
  ],
  night: [
    "好困哦...该睡觉了喵",
    "夜深了，早点休息吧",
    "熬夜对身体不好喵...",
    "明天再做吧，晚安~",
    "哈欠..."
  ]
};

let lastMessage = "";

export function generatePetMessage(context: MessageContext): string {
  const options = messages[context];
  if (!options || options.length === 0) return "喵~";
  
  // Try to avoid repeating the exact same message twice in a row
  let newMessage = options[Math.floor(Math.random() * options.length)];
  let attempts = 0;
  while (newMessage === lastMessage && attempts < 3 && options.length > 1) {
    newMessage = options[Math.floor(Math.random() * options.length)];
    attempts++;
  }
  
  lastMessage = newMessage;
  return newMessage;
}
