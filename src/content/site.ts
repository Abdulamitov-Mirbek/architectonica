// All site copy lives here. Edit text without touching components.
// Kyrgyz copy is a draft translation — have a native speaker review it before launch.

export const locales = ['ru', 'kg'] as const;
export type Locale = (typeof locales)[number];

/** BCP-47 language tag for <html lang>. Kyrgyz is "ky"; the URL uses "kg" as requested. */
export const htmlLang: Record<Locale, string> = { ru: 'ru', kg: 'ky' };

export const contacts = {
  phone: '+996 500 75 01 01',
  phoneHref: 'tel:+996500750101',
  email: '7architectonica@gmail.com',
  whatsappNumber: '996500750101',
  instagramHandle: '@adilet_architect_',
  instagramUrl: 'https://www.instagram.com/adilet_architect_/',
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${contacts.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export type FeatureId = 'solar' | 'greenRoof' | 'overhang' | 'groundLoop' | 'heatPump';

type Dict = {
  meta: { title: string; description: string };
  nav: { home: string; tech: string; projects: string; contact: string; menu: string; close: string; call: string };
  hero: { title: string[]; lead: string; primary: string; secondary: string; caption: string; scrollHint: string };
  tech: {
    title: string;
    lead: string;
    summer: string;
    winter: string;
    seasonLabel: string;
    seasonNote: { summer: string; winter: string };
    railLabel: string;
    loading: string;
    features: { id: FeatureId; title: string; text: string }[];
  };
  projects: {
    title: string;
    lead: string;
    prev: string;
    next: string;
    open: string;
    close: string;
    photos: Record<string, string>;
  };
  process: { title: string; steps: { title: string; text: string }[] };
  contact: {
    tagline: string;
    direct: string;
    whatsapp: string;
    instagram: string;
    formTitle: string;
    name: string;
    phone: string;
    message: string;
    messagePlaceholder: string;
    send: string;
    errors: { name: string; phone: string };
    messageIntro: string;
  };
  footer: { rights: string; role: string };
};

export const dict: Record<Locale, Dict> = {
  ru: {
    meta: {
      title: 'Architectonica — энергоэффективные дома в Кыргызстане',
      description:
        'Проектируем и строим энергоэффективные дома: солнечные панели, геотермальное отопление и архитектура, которая работает с солнцем.',
    },
    nav: {
      home: 'Главная',
      tech: 'Технологии',
      projects: 'Объекты',
      contact: 'Контакты',
      menu: 'Открыть меню',
      close: 'Закрыть меню',
      call: 'Позвонить',
    },
    hero: {
      title: ['Дома, которые', 'работают вместе', 'с природой'],
      lead: 'Проектируем и строим энергоэффективные дома в Кыргызстане. Солнце даёт электричество, земля — тепло, а архитектура управляет светом.',
      primary: 'Как устроен дом',
      secondary: 'Связаться с нами',
      caption: '3D-модель дома, построенного Architectonica',
      scrollHint: 'Листайте вниз: камера облетит дом',
    },
    tech: {
      title: 'Дом как единая система',
      lead: 'Каждый элемент работает на комфорт и экономию. Листайте дальше: камера покажет каждую систему на модели.',
      summer: 'Лето',
      winter: 'Зима',
      seasonLabel: 'Время года',
      seasonNote: {
        summer: 'Летом солнце стоит высоко: свес кровли закрывает окна, и дом не перегревается.',
        winter: 'Зимой солнце низкое: лучи проходят под свесом и прогревают комнаты.',
      },
      railLabel: 'Системы дома',
      loading: 'Загружаем модель…',
      features: [
        {
          id: 'solar',
          title: 'Солнечные панели',
          text: 'Панели на плоской кровле вырабатывают электричество для дома и теплового насоса.',
        },
        {
          id: 'greenRoof',
          title: 'Зелёная кровля',
          text: 'Растения на крыше утепляют дом, задерживают дождевую воду и дают место для отдыха.',
        },
        {
          id: 'overhang',
          title: 'Свес кровли 1 м',
          text: 'Высокое летнее солнце не попадает в окна, а низкое зимнее — свободно прогревает комнаты.',
        },
        {
          id: 'groundLoop',
          title: 'Геотермальный контур',
          text: 'Трубы в грунте забирают стабильное тепло земли: зимой для отопления, летом для охлаждения.',
        },
        {
          id: 'heatPump',
          title: 'Тепловой насос',
          text: 'Переносит тепло из грунта в дом и расходует в разы меньше энергии, чем электрокотёл.',
        },
      ],
    },
    projects: {
      title: 'Это не рендер. Это построенный дом',
      lead: 'Декоративная штукатурка с каменной крошкой, металлическая кровля и подшивка из лиственницы. Внутри — светлые пространства с натуральным деревом.',
      prev: 'Предыдущее фото',
      next: 'Следующее фото',
      open: 'Открыть фото',
      close: 'Закрыть',
      photos: {
        'facade-front': 'Фасад и плоская кровля с выносом',
        'living-dining': 'Гостиная и столовая',
        kitchen: 'Кухня',
        'wardrobe-glass': 'Гардероб с бронзовым стеклом',
        hallway: 'Холл и двери скрытого монтажа',
        'facade-entrance': 'Входная группа',
      },
    },
    process: {
      title: 'Как мы работаем',
      steps: [
        { title: 'Консультация', text: 'Обсуждаем участок, бюджет и ваш образ жизни.' },
        { title: 'Проект', text: 'Архитектура, инженерные системы и энергомодель дома.' },
        { title: 'Строительство', text: 'Возводим дом и монтируем инженерные системы.' },
        { title: 'Сдача', text: 'Передаём готовый дом и сопровождаем после заселения.' },
      ],
    },
    contact: {
      tagline: 'Стройте бизнес, строя вместе с нами!',
      direct: 'Связаться напрямую',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      formTitle: 'Расскажите о вашем проекте',
      name: 'Имя',
      phone: 'Телефон',
      message: 'Что хотите построить?',
      messagePlaceholder: 'Например: дом 150 м² на участке в Чуйской области',
      send: 'Отправить в WhatsApp',
      errors: { name: 'Введите имя.', phone: 'Введите номер телефона, чтобы мы могли перезвонить.' },
      messageIntro: 'Здравствуйте! Заявка с сайта Architectonica.',
    },
    footer: { rights: 'Все права защищены.', role: 'Архитектура и строительство' },
  },
  kg: {
    meta: {
      title: 'Architectonica — Кыргызстандагы энергияны үнөмдөөчү үйлөр',
      description:
        'Энергияны үнөмдөөчү үйлөрдү долбоорлойбуз жана курабыз: күн панелдери, геотермалдык жылытуу жана күн менен иштеген архитектура.',
    },
    nav: {
      home: 'Башкы бет',
      tech: 'Технологиялар',
      projects: 'Объекттер',
      contact: 'Байланыш',
      menu: 'Менюну ачуу',
      close: 'Менюну жабуу',
      call: 'Чалуу',
    },
    hero: {
      title: ['Жаратылыш', 'менен бирге', 'иштеген үйлөр'],
      lead: 'Кыргызстанда энергияны үнөмдөөчү үйлөрдү долбоорлойбуз жана курабыз. Күн электр берет, жер жылуулук берет, ал эми архитектура жарыкты башкарат.',
      primary: 'Үй кантип түзүлгөн',
      secondary: 'Биз менен байланышуу',
      caption: 'Architectonica курган үйдүн 3D-модели',
      scrollHint: 'Ылдый жылдырыңыз: камера үйдү айланып көрсөтөт',
    },
    tech: {
      title: 'Үй — бирдиктүү система',
      lead: 'Ар бир элемент жайлуулук жана үнөмдөө үчүн иштейт. Андан ары жылдырыңыз: камера моделде ар бир системаны көрсөтөт.',
      summer: 'Жай',
      winter: 'Кыш',
      seasonLabel: 'Жыл мезгили',
      seasonNote: {
        summer: 'Жайында күн бийик турат: чатырдын чыгыңкы бөлүгү терезелерди жаап, үй ысып кетпейт.',
        winter: 'Кышында күн жапыз: нурлар чатырдын астынан өтүп, бөлмөлөрдү жылытат.',
      },
      railLabel: 'Үйдүн системалары',
      loading: 'Модель жүктөлүүдө…',
      features: [
        {
          id: 'solar',
          title: 'Күн панелдери',
          text: 'Жалпак чатырдагы панелдер үй жана жылуулук насосу үчүн электр энергиясын өндүрөт.',
        },
        {
          id: 'greenRoof',
          title: 'Жашыл чатыр',
          text: 'Чатырдагы өсүмдүктөр үйдү жылуу кармайт, жамгыр суусун токтотот жана эс алуучу жай түзөт.',
        },
        {
          id: 'overhang',
          title: '1 м чатыр чыгыңкысы',
          text: 'Жайкы бийик күн терезеге тийбейт, ал эми кышкы жапыз күн бөлмөлөрдү эркин жылытат.',
        },
        {
          id: 'groundLoop',
          title: 'Геотермалдык контур',
          text: 'Жердеги түтүктөр жердин туруктуу жылуулугун алат: кышында жылытуу, жайында муздатуу үчүн.',
        },
        {
          id: 'heatPump',
          title: 'Жылуулук насосу',
          text: 'Жердин жылуулугун үйгө өткөрөт жана электр казанга караганда бир нече эсе аз энергия сарптайт.',
        },
      ],
    },
    projects: {
      title: 'Бул рендер эмес. Бул курулган үй',
      lead: 'Таш күкүмдүү декоративдик шыбак, металл чатыр жана карагай менен капталган асты. Ичинде — табигый жыгачтуу жарык мейкиндиктер.',
      prev: 'Мурунку сүрөт',
      next: 'Кийинки сүрөт',
      open: 'Сүрөттү ачуу',
      close: 'Жабуу',
      photos: {
        'facade-front': 'Фасад жана чыгыңкы жалпак чатыр',
        'living-dining': 'Конок бөлмө жана тамактануучу жай',
        kitchen: 'Ашкана',
        'wardrobe-glass': 'Коло айнектүү гардероб',
        hallway: 'Холл жана жашыруун орнотулган эшиктер',
        'facade-entrance': 'Кире бериш',
      },
    },
    process: {
      title: 'Биз кантип иштейбиз',
      steps: [
        { title: 'Консультация', text: 'Жер тилкесин, бюджетти жана жашоо образыңызды талкуулайбыз.' },
        { title: 'Долбоор', text: 'Архитектура, инженердик системалар жана үйдүн энергетикалык модели.' },
        { title: 'Курулуш', text: 'Үйдү курабыз жана инженердик системаларды орнотобуз.' },
        { title: 'Тапшыруу', text: 'Даяр үйдү тапшырабыз жана көчүп киргенден кийин да колдойбуз.' },
      ],
    },
    contact: {
      tagline: 'Биз менен куруп, бизнесиңизди өнүктүрүңүз!',
      direct: 'Түз байланышуу',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      formTitle: 'Долбооруңуз жөнүндө айтып бериңиз',
      name: 'Атыңыз',
      phone: 'Телефон',
      message: 'Эмне курууну каалайсыз?',
      messagePlaceholder: 'Мисалы: Чүй облусундагы жер тилкесинде 150 м² үй',
      send: 'WhatsApp аркылуу жөнөтүү',
      errors: { name: 'Атыңызды жазыңыз.', phone: 'Сизге кайра чала алышыбыз үчүн телефон номериңизди жазыңыз.' },
      messageIntro: 'Саламатсызбы! Architectonica сайтынан өтүнмө.',
    },
    footer: { rights: 'Бардык укуктар корголгон.', role: 'Архитектура жана курулуш' },
  },
};

export type SiteDict = Dict;

export const photos = [
  { id: 'facade-front', src: '/images/exterior/facade-front.jpg', w: 1080, h: 607 },
  { id: 'living-dining', src: '/images/interior/living-dining.jpg', w: 607, h: 1080 },
  { id: 'kitchen', src: '/images/interior/kitchen.jpg', w: 607, h: 1080 },
  { id: 'wardrobe-glass', src: '/images/interior/wardrobe-glass.jpg', w: 607, h: 1080 },
  { id: 'hallway', src: '/images/interior/hallway.jpg', w: 607, h: 1080 },
  { id: 'facade-entrance', src: '/images/exterior/facade-entrance.jpg', w: 1080, h: 607 },
] as const;
