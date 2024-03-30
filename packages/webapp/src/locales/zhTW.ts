export default {
  app: {
    name: 'HeyForm',
    copy: '複製',
    copied: '已複製'
  },
  login: {
    signIn: '👋 歡迎回來！',
    logIn: '登入您的帳號',
    startFree: '建立一個帳號',
    signWith: '使用以下方式登入',
    noAccount: '還沒有帳號嗎？',
    bindAccountDescription: '已經是 HeyForm 的使用者了嗎？登入並連結您的帳號。',
    continueWith: '或者繼續使用',
    rememberMe: '記住我',
    forgotPassword: '忘記您的密碼？',
    or: '或者',
    Email: '電子郵件位址',
    Password: '密碼',
    button: '登入',
    Google: '使用 Google 登入',
    Apple: '使用 Apple 登入',
    Code: '驗證碼',
    GetCode: '取得驗證碼',
    CountDown: '{{count}} 秒後重新傳送',
    PhoneNumber: '手機號碼',
    CodeSendSuccess: '驗證碼已傳送到您的手機',
    bindAccount: '綁定帳號',
    signInAndBindPhoneNumber: '登入並綁定手機號碼',
    termsPrivacy:
      '登入即表示您同意我們的 <2>服務條款</2> 和 <6>隱私政策</6>。',
    EmailRequired: '無效的電子郵件位址',
    PasswordRequired: '無效的密碼',
    PhoneNumberRequired: '無效的手機號碼',
    CodeRequired: '無效的驗證碼'
  },
  auth: {
    signup: {
      signUp: '建立一個帳號',
      signIn: '使用現有帳號登入',
      signWith: '使用以下方式開始',
      continueWith: '或者繼續使用',
      nameCant: '名稱為必填',
      invalidEmail: '無效的電子郵件位址',
      PasswordViolation:
        '密碼必須至少有 8 個字元，並至少包含 1 個大寫字母、1 個小寫字母和 1 個數字。',
      agreeTo: '註冊即表示您同意我們的',
      terms: '服務條款',
      privacy: '隱私政策',
      and: '和',
      Email: '電子郵件位址',
      button: '開始使用'
    },
    forgotPassword: {
      forgot: '忘記密碼？',
      sendEmail: "我們將向您傳送一封帶有驗證碼的電子郵件。",
      link: '返回登入頁面',
      continue: '繼續'
    },
    resetPassword: {
      reset: '重設密碼',
      sentEmail:
        "我們已向您傳送一封帶有 6 位數字驗證碼的電子郵件，請檢查您的收件夾，位於",
      verificationCode: '驗證碼',
      invalidCode: '無效的驗證碼',
      newPassword: '新密碼',
      repeatPassword: '再次輸入密碼',
      passwordViolation:
        '您的密碼必須至少有 8 個字元，並至少包含 1 個大寫字母、1 個小寫字母和 1 個數字。',
      passwordMismatch: '您的新密碼和再次輸入密碼不符。'
    }
  },
  setup: {
    createW: '步驟 1：建立一個新的工作區',
    explain: '工作區是一個成員可以協作的共享環境。',
    name: '工作區名稱',
    logo: '工作區標誌',
    create: '建立'
  },
  project: {
    deleteProject: {
      del: '刪除專案',
      deleteExplain:
        '請記住，此操作是不可逆的，並將永久刪除與此專案相關的所有資料。',
      deleteExplain2:
        '一旦您確認刪除專案，您將無法再存取專案資料。',
      sendEmail: '一封包含驗證碼的電子郵件已傳送至',
      delBottom: '刪除專案',
      code: '驗證碼'
    },
    rename: '重新命名',
    del: '刪除',
    createForm: '建立一個新表單',
    create2: '建立',
    giveName: '給它一個名稱',
    bottom: '繼續',
    forms: '表單',
    Trash: '垃圾桶',
    renameP: '重新命名此專案',
    renameForm: '重新命名此表單',
    update: '更新',
    projectName: '專案名稱',
    formName: '表單名稱',
    suspended: '已暫停',
    draft: '草稿',
    active: '進行中',
    closed: '已關閉',
    edit: '編輯',
    dup: '複製',
    noForm: '此專案中尚未有任何表單',
    text: '只需選擇一個範本或從頭開始。',
    suspendForm: '此表單已被暫停',
    suspendText:
      '如果您對暫停有任何疑問，請點選下面的按鈕與我們聯絡。',
    contact: '聯絡我們',
    Deleting: '正在刪除表單...',
    Duplicating: '正在複製表單...',
    ProjectMembers: {
      members: '此專案的成員',
      explain: '指定的成員可以在此專案中共同管理活動。',
      assigned: '已指派',
      notAssigned: '未指派',
      leave: '離開',
      remove: '移除',
      assign: '指派',
      submissions: '提交',
      NoSubmissions: '尚未有任何提交',
      removeMember: '無法移除成員',
      assignMember: '無法指派成員',
      leftP: '您已經離開了此專案',
      leaveP: '無法離開此專案',
      you: ' (您)'
    },
    trash: {
      restore: '還原',
      delForever: '永久刪除',
      explain: '您可以還原在過去 30 天內刪除的任何文件。',
      link: '了解更多',
      noForm: "垃圾桶中沒有任何表單",
      daysExplain: '表單將在 30 天後從垃圾桶中永久刪除。',
      delForm: "將被永久刪除，而您無法將它恢復。",
      deleteForever: '永久刪除？',
      cancel: '取消',
      restoring: '正在還原表單',
      FormName: '表單名稱',
      LastUpdate: '最後更新'
    }
  },
  workspace: {
    members: {
      delMember:
        '一旦您確認刪除此成員，該成員將無法再存取此工作區的資料。',
      delConfirm: '您確定要刪除此成員嗎？',
      remove: '移除',
      inputPrompt: '請至少輸入一個有效的電子郵件位址',
      inviteMember: '邀請您的團隊成員',
      send: '邀請已傳送',
      inviteExplain:
        '您可以透過電子郵件邀請您的團隊成員加入工作區。邀請有效期為 7 天，將在',
      Add: '新增更多',
      sendBottom: '傳送邀請',
      member: '成員',
      manage: '管理誰有權存取工作區。',
      leave: '您確定要離開工作區嗎？',
      leaveExplain:
        '一旦您確認離開此工作區，您將無法再存取此工作區的資料。',
      bottomLeave: '離開',
      transferTitle: '您確定要轉移此工作區嗎？',
      transferWorkspace:
        '一旦您確認轉移此工作區，您將不再是此工作區的擁有者。',
      transfer: '轉移',
      Role: '角色',
      LastSeen: '最後上線時間',
      Action: '操作',
      index: {
        owner: '擁有者',
        member: '成員',
        transfer: '轉移所有權',
        leave: '離開工作區',
        invite: '邀請成員'
      }
    },
    workSpace: {
      createP: '建立一個新的專案',
      workExplain:
        '專案是工作區中的子組，您可以在其中新增工作區成員，以便在表單、受眾和整合方面進行協作。',
      createBottom: '建立',
      assign: '指派成員',
      createP2: '建立專案',
      noProject: '您還沒有任何專案',
      text: '專案就像一個小組，您可以在其中新增您的團隊成員以協作表單、受眾和整合。',
      forms: '表單',
      noForms: '還沒有表單'
    },
    settings: {
      WorkSettings: '工作區設定',
      subTitle: '管理您的工作區設定',
      up: '更新',
      id: '工作區 ID',
      nameW: '工作區名稱',
      delWorkspace: {
        sendEmail: '一封包含驗證碼的電子郵件已傳送至',
        dissolve: '解散工作區',
        warning:
          '請記住，此操作是不可逆的，並將永久刪除與此工作區相關的所有資料。',
        warning2:
          '一旦您確認解散工作區，您將無法再存取工作區資料。',
        warning3:
          '透過解散團隊，所有的表單和資料都將被擦除，無法恢復！請謹慎操作！'
      },
      receive: '一旦導出完成，您將收到一封帶有下載連結的電子郵件。',
      export: '匯出內容',
      getEmail: '在一個文件中取得一封包含所有表單和設定的電子郵件。',
      exportBottom: '請求您的資料',

      logo: '標誌',
      pickLogo: '為您的工作區選擇一個標誌'
    },
    createWorkspace: {
      optional: '可選的',
      newWorkspace: '建立新的工作區',
      text: '工作區是一個成員可以協作的共享環境。建立工作區後，您可以邀請其他人加入。',
      name: '工作區名稱',
      logo: '工作區標誌',
      create: '建立'
    },
    join: {
      invited: '您被邀請到',
      UsernameAdd: '的工作區',
      joinText: '加入工作區，開始一起工作！',
      member: '成員',
      bottom: '加入'
    }
  },
  user: {
    phoneNumber: '手機號碼',
    newPhoneNumber: '新手機號碼',
    update: '更新',
    settings: {
      avatar: '個人圖示',
      avatarText:
        'Gravatar 預設為您的 HeyForm 個人圖示，您可以在這裡上傳您的個人圖示。',
      deletedAccount: {
        sendEmail: '一封包含驗證碼的電子郵件已傳送至',
        del: '刪除帳號',
        delText:
          '此操作無法撤銷。這將永久刪除您的整個帳號。您建立的所有工作區都將被刪除，並且您將從所有共享工作區中移除。',
        delSure:
          '如果您確定要繼續刪除您的帳號，請繼續以下操作。',
        delBottom: '刪除我的帳號',
        delCode: '驗證碼',
        delAccount: '已排程刪除帳號',
        delSendEmail:
          '我們已排程在 48 小時內刪除您的帳號。完成後，您將收到一封電子郵件確認。',
        loggedOut: '您將會登出',
        delText2:
          '這將永久刪除您的整個帳號。您的所有表單、提交和工作區都將被刪除',
        danger: '危險區域'
      },
      emailAddress: {
        change: '更改您的電子郵件位址',
        sendEmail: '我們將向您傳送一封帶有 6 位數字驗證碼的電子郵件。',
        newEmail: '新電子郵件位址',
        checkEmail: '檢視您的電子郵件',
        code: "我們已向您傳送一封帶有 6 位數字驗證碼的電子郵件。請檢視您的收件夾：",
        continue: '繼續',
        changeEmail: '更改電子郵件位址',
        send: '傳送'
      },
      phoneNumber: {
        change: '更改您的手機號碼',
        description: '更改後，您可以使用新的手機號碼登入。'
      },
      account: '帳號設定',
      accountText: '對帳號設定的更改將應用於您的所有工作區。',
      password: {
        changeText: '您的密碼已更改',
        changeP: '更改密碼',
        currentPassword: '目前的密碼',
        newP: '新的密碼'
      },
      name: '您的名字'
    },
    verifyEmail: '驗證您的電子郵件位址',
    sendEmailText:
      '我們已向您傳送一封帶有 6 位數字驗證碼的電子郵件。請檢視您的收件夾：',
    typoEmail: '輸入了錯誤的電子郵件位址？',
    click: '點選這裡',
    change: '來更改它。',
    text: '沒有收到驗證碼？',
    resend: '重新傳送'
  },
  form: {
    create: '建立',
    connect: '連接',
    share: '分享',
    results: '結果',
    settings: '設定',
    published: '已發布',
    analytics: '分析',
    submissions: '送出',
    preview: '預覽',
    publish: '發布'
  },
  share: {
    embed: '嵌入網站',
    Standard: '標準',
    Mode: '模式',
    scanCode: '掃描 QR Code 以開啟表單，無論線上還是離線，都可以使用印表機。',
    getCode: '取得 QR Code',
    selectGroups: '您可以選擇以下群組分享表單，您也可以',
    addContacts: '新增聯絡人',
    Or: '或將它們組織成',
    ShareAudience: '分享給受眾',
    groups: '群組',
    Groups: '群組',
    noGroups: '群組不能為空',
    findGroup: '尋找或建立群組',
    createGroup: '建立新群組',
    Share: '分享',
    shareLin: '透過連結分享',
    enablePassword: '啟用對表單的密碼存取',
    Url: '公開網址',
    custom: '自訂網域',
    shareAudience: '分享給受眾',
    sendForm: '將表單傳送給合適的受眾以獲得準確的結果。您可以',
    organize: '或將它們組織成',
    easilyShare:
      '無需每次手動輸入所有電子郵件位址，即可更輕鬆地與他們共享表單。',
    embedWeb: [
      {
        title: '標準',
        description: '將 HeyForm 作為您網站的一部分呈現'
      },
      {
        title: '彈出',
        description: 'HeyForm 在螢幕中央彈出。'
      },
      {
        title: '彈出視窗',
        description: '當點選右上角的按鈕時，浮動彈出視窗。'
      },
      {
        title: '側邊標籤',
        description: '當點選右邊緣的按鈕時，浮動面板。'
      }
    ],
    Code: '程式碼',
    shared: '表單已成功分享',
    fetchGroups: '無法取得受眾群組',
    Analytics: '分析'
  },
  analytics: {
    Analytics: '分析',
    Report: '報告',
    Submissions: '提交',
    Views: '檢視',
    complete: '完成率',
    Average: '平均時間',
    topAudience: '熱門受眾地點',
    AnalyticsOverview: '分析概覽',
    time: ['最近一週', '最近一個月', '最近三個月', '最近一年'],
    Responses: '回應'
  },
  report: {
    Responses: '回應',
    Questions: '問題',
    Print: '列印',
    responses: '回應',
    seeAll: '檢視所有 {{count}} 個回應',
    noSubmission: '還沒有任何回應。您可以與更多人分享此表單。',
    average: '平均'
  },
  submissions: {
    Inbox: '收件夾',
    Spam: '垃圾郵件',
    export: '匯出 CSV',
    Delete: '刪除',
    selected: '已選擇',
    Deselect: '取消全選',
    NoSubmissions: '尚未有任何回應',
		SubHeadline: '線上分享表單以吸引更廣泛的受眾。'
  },
  formSettings: {
    Form: '表單設定',
    subTitle: '管理您的表單設定',
    Extra: '額外的',
    subArchive: '提交存檔',
    archiveText:
      "如果您不希望 HeyForm 儲存您的提交，請停用提交存檔。",
    timeLimit: '時間限制',
    timeText:
      '如果您希望在倒數計時結束後阻止送出，可以在此設定允許的時間。',
    dataError: '請輸入有效的數字',
    Hour: '小時',
    Minute: '分鐘',
    Second: '秒',
    Day: '天',
    progressBar: '進度條',
    progressText: '您可以輕鬆讓受訪者知道他們完成您的表單的進度。',
    Redirect: '完成時重新導向',
    redirectText:
      '填寫完您的表單後，將您的受訪者帶到另一個網頁。',
    Update: '更新',
    Basic: '基本',
    formUpdated: '表單設定已成功更新',
    status: '表單狀態',
    closeForm: '關閉表單',
    closeFormText:
      '您可以關閉此表單以停止接收新的回應，並防止公眾存取該表單。',
    closedFormMessage: '關閉表單訊息',
    closedFormMessageText:
      '如果您以以上選項關閉了表單，則收件人將看到此內容。',
    closedFormTitle: '標題',
    closedFormDescription: '描述',
    expiration: '到期時關閉',
    expirationText:
      '如果您希望在特定日期範圍內接收回應，可以在此設定開始和結束日期。',
    to: '至',
    dateErr: '結束日期必須在開始日期之後',
    submission: '提交數量限制',
    submissionText:
      '這允許您為表單設定特定的回應總數。',
    IpLimit: '同一 IP 位址提交頻率限制',
    IpLimitText:
      '如果您希望在一段時間內限制同一 IP 位址的提交次數，可以在此設定。',
    Protection: '保護',
    Anti: '防垃圾郵件',
    AntiText: '啟用以防止垃圾郵件。',
    Bots: '防機器人',
    BotsText: '啟用驗證碼以防止機器人提交。',
    deleteForm: '刪除此表單',
    deleteFormText:
      '刪除表單將從我們的資料庫中擦除此表單的所有痕跡，包括所有提交。',
    archive: '您確定要停用提交存檔嗎？',
    archiveConfirm:
      '一旦您確認停用提交存檔，所有提交將被刪除。',
    Cancel: '取消',
    Confirm: '確認',
    Disable: '停用',  
    times: '次 每',
    Language: '語言',
    LanguageDescription:
      '選擇受訪者將看到您表單的語言。適用於非自訂文字，例如預設按鈕、驗證錯誤等。'
  },
  integration: {
    Categories: '類別',
    connectText: '將您的表單資料與您喜愛的應用程式連接，參考',
    help: '幫助中心',
    helpApp: '以取得使用說明。',
    Integrations: '整合',
    AirtableText:
      'Airtable 使用簡單的基於令牌的身份驗證。要產生或管理您的 API 金鑰，請存取您的',
    airtablePage: 'Airtable 帳號頁面',
    airtableLabel: 'Airtable API 金鑰',
    AirtableId: 'Airtable 基礎 ID',
    open: '要取得您的 Airtable 基礎 ID，請開啟',
    airtableLink: 'Airtable API 頁面',
    airtableIDText:
      '並點選您要使用的基礎。您將在介紹部分找到您的基礎 ID。',
    tableText:
      "輸入表格名稱時必須與您的 Airtable 基礎上的名稱完全相同，例如：Table 1。",
    tableText2:
      "如果您在 Airtable 上更改了表格名稱，請在此處也進行更新，否則整合將無法按預期運作。",
    tableName: '表格名稱',
    mapFields: '對映欄位',
    tableText3:
      "將 HeyForm 對映到 Airtable 欄位。輸入 Airtable 欄位名稱時必須與您的表格上的名稱完全相同。如果您在 Airtable 上更改了欄位名稱，請在此處也進行更新，否則整合將無法按預期運作。",
    DropboxText:
      '如果您在表單中添加了 "檔案上傳" 元件，則將檔案放置在資料夾中。',
    select: '選擇資料夾',
    Connect: '連接',
    coming: '即將推出',
    githubConnect: '您可以選擇您自己的帳號或與您連接的組織。',
    chatId: '聊天 ID',
    Add: '新增',
    toTelegram: '到您的 Telegram 群組，輸入',
    inTelegram: '在群組中，您將收到一條帶有聊天 ID 的訊息。',
    labelWeb: '自訂 Webhook 網址',
    labelSlack: 'Webhook 網址',
    createS: '建立您的',
    appSlack: 'Slack 應用程式',
    pasteSlack: '啟用 Incoming Webhooks 並在此處貼上 Webhook 網址。',
    trackingCode: '追蹤碼',
    copyGoogle: '複製並貼上您的 Google Analytics 追蹤碼。',
    link: '如何找到我的追蹤碼？',
    addA: '新增一個',
    customBots: '自訂機器人',
    customBotText: '在您的群組中，並從機器人設定中貼上 Webhook 網址。',
    PixelID: 'Pixel ID',
    copyId: '複製並貼上您的 Facebook Pixel ID。',
    findId: '如何找到我的 Pixel ID？',
    ServerURL: '伺服器網址',
    gitlabURL:
      '系統網址是您存取系統前端的網址。例如：https://domain.com。',
    tokens: '個人存取令牌',
    obtainToken:
      '要取得存取令牌，請開啟 https://domain.com/-/profile/personal_access_tokens 並新增一個。您也可以存取',
    helpDocument: '幫助文件',
    SelectGroup: '選擇群組',
    selectGroup: '您可以選擇您自己的群組或與您連接的群組。',
    selectProject: '選擇專案',
    selectMember: '選擇成員（可選填的）',
    selectLabel: '選擇標籤（可選填的）',
    selectMilestone: '選擇里程碑（可選填的）',
    issueTitle: '問題標題',
    issueDescription: '問題描述（可選填的）',
    SelectOrganization: '選擇組織',
    selectRepository: '選擇儲存庫',
    selectAssignee: '選擇接收人（可選填的）',
    selectDrive: '選擇硬碟',
    selectGoogleDrive: '您可以選擇您自己的 Google 硬碟或',
    GoogleSharedDrives: 'Google 共享硬碟',
    with: '與您有聯絡。',
    SelectFolder: '選擇資料夾',
    GoogleText:
      '如果您在表單中添加了 "檔案上傳" 元件，則將檔案放置在資料夾中。',
    SelectSpreadsheet: '選擇試算表',
    SelectWorksheet: '選擇工作表',
    MapFields: '對映欄位',
    googleSheet:
      '將 HeyForm 對映到 Google Sheets 欄位。如果您在 Google Sheets 上更改了一個欄位，請在此處進行更新，否則整合將無法按預期運作。',
    leftPlaceholder: 'HeyForm 問題',
    rightPlaceholder: 'Google Sheets 欄位',
    leftTipText: '選擇 HeyForm 問題',
    rightTipText: '選擇 Google Sheets 欄位',
    ColumnValues: '列值（可選填的）',
    mondayText:
      '將 HeyForm 對映到 Monday 列。如果您在 Monday 更改了一列，請也在此處更新，否則整合將無法按預期運作。',
    Board: '機構',
    SelectBoard: '選擇一個機構',
    Group: '群組（可選填的）',
    ItemName: '專案名稱',
    mondayColumn: '選擇 Monday 列',
    selectQuestion: '選擇一個問題',
    PhoneNumber: '手機號碼（可選填的）',
    JobTitle: '職位名稱（可選填的）',
    SelectAudience: '選擇受眾',
    SubscriberEmail: '訂閱者電子郵件',
    Address: '地址',
    AddField: '新增欄位',
    ConnectWith: '連接到',
    SystemURL: '系統網址',
    serverURL: '伺服器網址',
    serverURLText:
      '伺服器網址是您存取系統前端的網址。例如：https://support.domain.com 或 https://domain.com/support。',
    ApiKey: 'API 金鑰',
    ApiKeyText:
      '透過前往管理 -> API 金鑰的管理面板生成 API 金鑰，確保它具有建立票證的權限',
    LearnAbout: '了解更多',
    integration: '整合',
    URLText:
      '系統網址是您存取系統前端的網址。這可能是例如：https://support.domain.com 或 https://domain.com/support。系統網址可能需要 "/index.php"。如果您沒有啟用漂亮的地址，請在網址的末端新增 ".php"。',
    tokenAPT: 'API 令牌',
    APIText:
      '透過前往設定 -> 一般 -> API 令牌生成 API 令牌，並確保它具有讀寫權限。',
    UserName: '使用者名稱（可選填的）',
    UserEmail: '電子郵件位址（可選填的）',
    UserNameRequired: '使用者名稱',
    UserEmailRequired: '電子郵件位址',
    Subject: '主題',
    Text: '文字',
    Message: '訊息',
    Department: '部門',
    department: '選擇部門',
    Priority: '優先順序',
    ChoosePriority: '選擇優先順序',
    Status: '狀態',
    ChooseStatus: '選擇狀態',
    Authorization: '授權',
    AuthorizationText: '首先，請授權 HeyForm 存取您的資料',
    login: '登入到',
    loginGoogle: '登入 Google'
  },
  template: {
    Templates: '範本',
    UseTemplate: '使用範本',
    create: '建立一個新表單'
  },
  createForm: {
    typeText:
      '根據您的目的選擇表單類型。一旦建立表單，就無法更改表單類型。',
    createNew: '從頭開始建立一個新表單',
    ClassicForm: '經典表單',
    templatesForm: '從範本建立新表單',
    URLForm: '從外部網址匯入表單'
  },
  other: {
    DragUploader: {
      drag: '或拖放',
      upTo: 'PNG、JPG、GIF 最多',
      upload: '上傳檔案'
    },
    labelList: {
      Dashboard: '儀錶板',
      TeamMembers: '團隊成員',
      Audiences: '受眾',
      Billing: '帳單',
      Workspace: '工作區設定',
      Projects: '專案',
      Resources: '資源',
      GettingStarted: '快速開始',
      Help: '幫助中心',
      Template: '範本',
      Changelog: '更新日誌',
      View: '檢視個人資訊',
      Account: '帳號設定',
      Logout: '登出',
      CreateWorkspace: '建立工作區',
      Version: '版本'
    },
    Change: '更換',
    Remove: '移除',
    Search: '搜尋 Unsplash 圖片',
    Upload: '上傳',
    Unsplash: 'Unsplash'
  },
  formBuilder: {
    type: '類型',
    settings: '設定',
    required: '必填',
    dateFormat: '日期格式',
    timeField: '時間欄位',
    dateRangeTo: '至',
    multipleSelection: '多選',
    unlimited: '無限制',
    exactNumber: '確定數量',
    range: '範圍',
    randomize: '隨機選項',
    steps: '步驟',
    labels: '標籤',
    leftLabel: '左標籤',
    middleLabel: '中標籤',
    rightLabel: '右標籤',
    defaultCountry: '預設國家',
    star: '星星',
    like: '喜歡',
    thumbsUp: '讚',
    crown: '皇冠',
    happy: '開心',
    buttonText: '按鈕文字',
    image: '圖片',
    changeImage: '更換',
    removeImage: '移除',
    addImage: '新增',
    layout: '版面配置',
    brightness: '亮度',
    duplicate: '複製',
    delete: '刪除',
    question: '問題',
    questionPlaceholder: '輸入一個問題',
    descriptionPlaceholder: '為您的問題新增描述（可選填的）',
    recommended: '推薦',
    contactInfo: '聯絡資訊',
    choices: '選擇',
    text: '文字',
    legalConsent: '法律與同意',
    formStructure: '表單結構',
    Content: '內容',
    searchFieldType: '尋找問題類型',
    allFieldTypes: '所有問題類型',
    welcome: '歡迎頁面',
    thankYou: '感謝頁面',
    multipleChoice: '多選題',
    phoneNumber: '手機號碼',
    shortText: '短文字',
    longText: '長文字',
    questionGroup: '問題群組',
    statement: '聲明',
    pictureChoice: '圖片選擇',
    yesNo: '是或否',
    email: '電子郵件',
    fullName: '全名',
    rating: '評分',
    opinionScale: '意見量表',
    date: '日期',
    dateTime: '日期與時間',
    dateRange: '日期範圍',
    number: '數字',
    fileUpload: '檔案上傳',
    payment: '付款',
    address: '地址',
    country: '國家',
    legalTerms: '法律條款',
    signature: '簽名',
    website: '網站',
    address1: '地址 1',
    address2: '地址 2（可選填的）',
    city: '城市',
    state: '州/省',
    zip: '郵遞區號',
    selectCountry: '選擇一個國家',
    year: '年',
    month: '月',
    day: '日',
    hour: '小時',
    minute: '分鐘',
    clickUpload: '點選或拖放檔案以上傳。',
    sizeLimit: '大小限制：10MB',
    firstName: '姓',
    lastName: '名',
    accept: '我接受',
    dontAccept: '我不接受',
    yourAnswer: '在這裡輸入您的答案',
    hitTip: '按下 Shift ⇧ + Enter ↵ 來換行',
    addChoice: '新增選項',
    choicePlaceholder: '選項',
    drawSignature: '在上方簽名',
    clearSignature: '清除',
    data: '資料',
    inputTable: '輸入表格',
    addColumn: '新增列',
    columnPlaceholder: '列 {{index}}',
    design: '設計',
    theme: '主題',
    customize: '自訂',
    customCSS: '自訂 CSS',
    submitDate: '送出日期',
    contact: '聯絡',
    customText: '自訂文字',
    customSingle: '自訂單選',
    customMultiple: '自訂多選',
    logic: '邏輯',
    addNewQuestion: '新增問題',
    variable: {
      title: '變數',
      description:
        '表單變數代表一個基於您的受訪者在表單中的回答計算的隱藏值。例如，計算測驗的分數。',
      empty: '還沒有變數，您可以點選 "新增變數" 來新增一個。',
      add: '新增變數',
      update: '更新變數',
      edit: '編輯變數',
      addButton: '新增變數',
      updateButton: '更新變數',
      value: '預設值：{{value}}',
      type: '類型',
      name: '名稱',
      default: '預設值',
      string: '字串',
      number: '數字'
    },
    edit: '編輯',
    rules: '規則',
    bulkEdit: '批次編輯',
    bulkEditDescription: "批次編輯多個問題的邏輯",
    removeAll: '移除全部',
    saveChanges: '儲存變更',
    cancel: '取消',
    when: '當',
    then: '然後',
    deleteRule: '刪除規則',
    rulePlaceholder:
      '還沒有規則。在左側預覽中選擇一個問題並在彈出面板中新增規則。您也可以點選 "批次編輯" 來批次編輯所有規則。',
    singleRule: '已設定 1 個規則',
    multipleRules: '已設定 {{count}} 個規則',
    redirect: '完成時重新導向',
    buttonLinkUrl: '按鈕連結網址',
    CustomCSS: '自訂 CSS',
    CustomCSSDescription:
      '如果主題或自訂定義的樣式無法滿足您的需求，您可以插入自訂 CSS 以修改為您所需的樣式。',
    customCssTableDescription: '描述',
    customCssTableClass: 'CSS 類別',
    ConnectStripe: '連接到 Stripe',
    price: '價格',
    currency: '貨幣'
  }
}
