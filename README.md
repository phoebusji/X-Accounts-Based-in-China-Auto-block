# X-Accounts-Based-in-China-Auto-Block
Auto-Block CCP troll X (Twitter) accounts.

Database Used: 
- [basedinchina.com](https://basedinchina.com/home)
- [pluto0x0/X_based_china](https://github.com/pluto0x0/X_based_china)

GitHub Repository: [X-Accounts-Based-in-China-Auto-Mute](https://github.com/anonym-g/X-Accounts-Based-in-China-Auto-Mute)

By [@trailblaziger](https://x.com/trailblaziger)

## Usage

原始作者的脚本是mute操作，我改成了block操作。由于twitter的限制，原始的脚本，在获取已经blocked账号的时候，很快触发429限速，现在改成手动获取blocked账号列表（能力有限，没找到更好的方法）。
脚本运行流程及注意事项：
1. 脚本基于原作者anonym-g(https://github.com/anonym-g), 我不懂脚本，使用AI grok，帮我修改。
2. 进入Blocked Accounts页面(https://x.com/settings/blocked/all).
3. 手动向下翻页，刷出一些数量的blocked账号。
4. 滚动条拖到最上面，运行脚本，脚本自动翻页向下刷出所有账号。
5. 在自动获取blocked的时候，脚本运行时需要处于前台，不能切换标签页，不能锁屏，等待完全获取后，可以切换到后台。
6. 也可以手动刷出所有账号后，再运行脚本。
7. 可能由于twitter的限制，有时刷了一会刷不出来了，可以手动往回翻几页再往后翻页。
8. 由于每次获取blocked的脚本非常慢，添加了可以选择从上次获取的blocked的本地存储来运行来节省时间，但注意定期需要完整网页获取。首次运行需要完整网页获取。
9. 由于twitter 的短时间blocked数量限制，会出现401错误，账号被强制退出，需要重新登录账号。
10. 我自己运行的感觉twitter每天block的上限好像是1000左右。
11. 脚本中的2个地方可以根据自己情况修改：
     a. 修改block之间的间隔（目前设置是15分钟50个账号，调小可能会很快触发风控，单位ms）:               return { MIN: 15000, MAX: 21000 };
     b. 设置从网页获取的blocked账号的网页翻页间隔(目前3.5s，如果已经刷出了所有账号，可以调小，单位ms):  await Utils.sleep(3000 + Math.random() * 1000);
12. 账号需要开启两步验证，防止账号被封掉。
13. 谨慎运行脚本，防止自己账号被封掉。
14. 如果账号被封与本人无关。


### 1. 安装 Tampermonkey 插件
前往 Chrome 浏览器的扩展程序商店，搜索 "Tampermonkey" 并下载安装。

![安装油猴](https://github.com/anonym-g/X-Accounts-Based-in-China-Auto-Mute/raw/main/pictures/install-tampermonkey.png)

### 2. 开启开发者模式
进入 Chrome 的扩展程序管理页面 (`chrome://extensions/`)，在右上角打开“开发者模式” (Developer mode)。然后进入 Tampermonkey 插件“详情”页，开启“允许运行用户脚本”。

*注：部分环境下，如果不开启此模式，脚本可能无法正常注入或运行。*

![开启开发者模式](https://github.com/anonym-g/X-Accounts-Based-in-China-Auto-Mute/raw/main/pictures/extension.png)

### 3. 安装并启用脚本
前往[油猴脚本页面](https://greasyfork.org/en/scripts/556758-twitter-x-glass-great-wall)，安装脚本并启用。

![安装脚本](https://github.com/anonym-g/X-Accounts-Based-in-China-Auto-Mute/raw/main/pictures/tampermonkey-script.png)

### 4. 在 X (Twitter) 主页使用

![使用脚本](https://github.com/anonym-g/X-Accounts-Based-in-China-Auto-Mute/raw/main/pictures/X-home.png)
