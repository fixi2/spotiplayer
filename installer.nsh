; NSIS Installer Script для Spotify Overlay Player
; Дополнительные настройки установки

; Запрашиваем права администратора если нужно
RequestExecutionLevel user

; Макросы для установки
!macro customInstall
  ; Создаем ярлык автозапуска если пользователь выбрал эту опцию
  ${if} $AutoStartCheckbox == ${BST_CHECKED}
    ; Добавляем в автозагрузку Windows
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "SpotifyOverlayPlayer" "$INSTDIR\${PRODUCT_FILENAME}.exe --hidden"
  ${endif}
  
  ; Регистрируем протокол для авторизации Spotify
  WriteRegStr HKCR "spotify-overlay" "" "URL:Spotify Overlay Player Protocol"
  WriteRegStr HKCR "spotify-overlay" "URL Protocol" ""
  WriteRegStr HKCR "spotify-overlay\DefaultIcon" "" "$INSTDIR\${PRODUCT_FILENAME}.exe,1"
  WriteRegStr HKCR "spotify-overlay\shell\open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}.exe" "%1"'
  
  ; Создаем uninstall entry
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "Publisher" "${COMPANY_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayIcon" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "NoRepair" 1
!macroend

; Макросы для удаления
!macro customUnInstall
  ; Удаляем из автозагрузки
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "SpotifyOverlayPlayer"
  
  ; Удаляем протокол
  DeleteRegKey HKCR "spotify-overlay"
  
  ; Удаляем uninstall entry
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
  
  ; Спрашиваем пользователя о сохранении конфигурации
  MessageBox MB_YESNO|MB_ICONQUESTION "Удалить конфигурационные файлы и логи?" /SD IDNO IDYES removeConfig IDNO keepConfig
  
  removeConfig:
    RMDir /r "$APPDATA\${PRODUCT_FILENAME}"
    Goto done
    
  keepConfig:
    ; Информируем где остались файлы
    MessageBox MB_OK|MB_ICONINFORMATION "Настройки и логи сохранены в папке:$\n$APPDATA\${PRODUCT_FILENAME}"
    
  done:
!macroend

; Дополнительные страницы установщика
!macro customHeader
  ; Добавляем чекбокс для автозапуска
  !include "MUI2.nsh"
  !include "nsDialogs.nsh"
  !include "LogicLib.nsh"
  
  Var AutoStartCheckbox
  Var AutoStartCheckboxState
  
  Page custom AutoStartPage AutoStartPageLeave
  
  Function AutoStartPage
    nsDialogs::Create 1018
    Pop $0
    
    ${NSD_CreateLabel} 0 0 100% 20u "Дополнительные настройки:"
    Pop $0
    
    ${NSD_CreateCheckbox} 10 30u 100% 10u "&Запускать автоматически при входе в Windows"
    Pop $AutoStartCheckbox
    
    ${NSD_CreateLabel} 10 50u 100% 40u "Приложение будет автоматически запускаться при загрузке Windows и работать в фоновом режиме, отслеживая состояние Spotify."
    Pop $0
    
    ; По умолчанию включено
    ${NSD_Check} $AutoStartCheckbox
    
    nsDialogs::Show
  FunctionEnd
  
  Function AutoStartPageLeave
    ${NSD_GetState} $AutoStartCheckbox $AutoStartCheckboxState
  FunctionEnd
!macroend

; Дополнительные переменные
!macro customInit
  ; Проверяем, запущено ли приложение
  System::Call 'kernel32::CreateMutexA(i 0, i 0, t "SpotifyOverlayPlayerInstaller") i .r1 ?e'
  Pop $R0
  StrCmp $R0 0 +3
    MessageBox MB_OK|MB_ICONEXCLAMATION "Установщик уже запущен!"
    Abort
    
  ; Проверяем версию Windows (минимум Windows 10)
  ${If} ${AtMostWin8.1}
    MessageBox MB_OK|MB_ICONSTOP "Приложение требует Windows 10 или новее."
    Abort
  ${EndIf}
  
  ; Проверяем наличие .NET Framework или Visual C++ Redistributable если нужно
  ; (можно добавить проверки зависимостей)
!macroend

; Послеустановочные действия
!macro customFinishPage
  ; Показываем страницу завершения с опциями
  !define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_FILENAME}.exe"
  !define MUI_FINISHPAGE_RUN_TEXT "Запустить ${PRODUCT_NAME}"
  !define MUI_FINISHPAGE_RUN_PARAMETERS "--first-run"
  
  !define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Показать инструкции по настройке"
  
  ; Предлагаем открыть сайт разработчика
  !define MUI_FINISHPAGE_LINK "Посетить сайт разработчика"
  !define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/your-username/spotify-overlay-player"
!macroend
