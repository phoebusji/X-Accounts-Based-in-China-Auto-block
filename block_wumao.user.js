// ==UserScript==
// @name         Twitter/X Glass Great Wall (Block Version)
// @namespace    https://github.com/phoebusji/X-Accounts-Based-in-China-Auto-block
// @version      3.0.9-block-stop  // 更新版本号以反映修改
// @description  Auto-Block CCP troll X (Twitter) accounts. 自动拉黑 X (Twitter) 五毛账号。
// @author       OpenSource
// @match        https://x.com/*
// @match        https://twitter.com/*
// @connect      basedinchina.com
// @connect      archive.org
// @connect      raw.githubusercontent.com
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ===== 集成 HackTimer.js 以防止后台标签页定时器节流 =====
    // 这会覆盖 setTimeout/setInterval，使其使用 Web Worker 在后台正常运行
    (function () {
        var workerScript = '';
        if (!/MSIE 10/i.test(navigator.userAgent)) {
            try {
                var blob = new Blob(["\
var fakeIdToId = {};\
onmessage = function (event) {\
    var data = event.data,\
        name = data.name,\
        fakeId = data.fakeId,\
        time;\
    if(data.hasOwnProperty('time')) {\
        time = data.time;\
    }\
    switch (name) {\
        case 'setInterval':\
            fakeIdToId[fakeId] = setInterval(function () {\
                postMessage({fakeId: fakeId});\
            }, time);\
            break;\
        case 'clearInterval':\
            if (fakeIdToId.hasOwnProperty (fakeId)) {\
                clearInterval(fakeIdToId[fakeId]);\
                delete fakeIdToId[fakeId];\
            }\
            break;\
        case 'setTimeout':\
            fakeIdToId[fakeId] = setTimeout(function () {\
                postMessage({fakeId: fakeId});\
                if (fakeIdToId.hasOwnProperty (fakeId)) {\
                    delete fakeIdToId[fakeId];\
                }\
            }, time);\
            break;\
        case 'clearTimeout':\
            if (fakeIdToId.hasOwnProperty (fakeId)) {\
                clearTimeout(fakeIdToId[fakeId]);\
                delete fakeIdToId[fakeId];\
            }\
            break;\
    }\
}\
"]);
                workerScript = window.URL.createObjectURL(blob);
            } catch (error) {}
        }
        var worker,
            fakeIdToCallback = {},
            lastFakeId = 0,
            maxFakeId = 0x7FFFFFFF,
            logPrefix = 'HackTimer: ';
        if (typeof (Worker) !== 'undefined' && workerScript) {
            function getFakeId() {
                do {
                    if (lastFakeId == maxFakeId) {
                        lastFakeId = 0;
                    } else {
                        lastFakeId++;
                    }
                } while (fakeIdToCallback.hasOwnProperty(lastFakeId));
                return lastFakeId;
            }
            try {
                worker = new Worker(workerScript);
                window.setInterval = function (callback, time /* , parameters */) {
                    var fakeId = getFakeId();
                    fakeIdToCallback[fakeId] = {
                        callback: callback,
                        parameters: Array.prototype.slice.call(arguments, 2)
                    };
                    worker.postMessage({
                        name: 'setInterval',
                        fakeId: fakeId,
                        time: time
                    });
                    return fakeId;
                };
                window.clearInterval = function (fakeId) {
                    if (fakeIdToCallback.hasOwnProperty(fakeId)) {
                        delete fakeIdToCallback[fakeId];
                        worker.postMessage({
                            name: 'clearInterval',
                            fakeId: fakeId
                        });
                    }
                };
                window.setTimeout = function (callback, time /* , parameters */) {
                    var fakeId = getFakeId();
                    fakeIdToCallback[fakeId] = {
                        callback: callback,
                        parameters: Array.prototype.slice.call(arguments, 2),
                        isTimeout: true
                    };
                    worker.postMessage({
                        name: 'setTimeout',
                        fakeId: fakeId,
                        time: time
                    });
                    return fakeId;
                };
                window.clearTimeout = function (fakeId) {
                    if (fakeIdToCallback.hasOwnProperty(fakeId)) {
                        delete fakeIdToCallback[fakeId];
                        worker.postMessage({
                            name: 'clearTimeout',
                            fakeId: fakeId
                        });
                    }
                };
                worker.onmessage = function (event) {
                    var data = event.data,
                        fakeId = data.fakeId,
                        request,
                        parameters,
                        callback;
                    if (fakeIdToCallback.hasOwnProperty(fakeId)) {
                        request = fakeIdToCallback[fakeId];
                        callback = request.callback;
                        parameters = request.parameters;
                        if (request.hasOwnProperty('isTimeout') && request.isTimeout) {
                            delete fakeIdToCallback[fakeId];
                        }
                    }
                    if (typeof (callback) === 'string') {
                        try {
                            callback = new Function(callback);
                        } catch (error) {
                            console.log(logPrefix + 'Error parsing callback code string: ', error);
                        }
                    }
                    if (typeof (callback) === 'function') {
                        callback.apply(window, parameters);
                    }
                };
                worker.onerror = function (event) {
                    console.log(event);
                };
            } catch (error) {
                console.log(logPrefix + 'Initialization failed');
                console.error(error);
            }
        } else {
            console.log(logPrefix + 'Initialization failed - HTML5 Web Worker is not supported');
        }
    })();

    /**
     * 配置模块
     */
    class Config {
        static get TWITTER() {
            return {
                BEARER_TOKEN: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
                API_BLOCK_LIST: 'https://x.com/i/api/1.1/blocks/list.json',
                API_BLOCK_CREATE: 'https://x.com/i/api/1.1/blocks/create.json',
                API_RATE_LIMIT_STATUS: 'https://x.com/i/api/1.1/application/rate_limit_status.json',
            };
        }

        static get REMOTE_SOURCES() {
            return {
                FULL_LIST: "https://basedinchina.com/api/users/all",
                SECOND_LIST: "https://raw.githubusercontent.com/pluto0x0/X_based_china/main/china.jsonl"
            };
        }

        static get CACHE_KEYS() {
            return {
                LOCAL_BLOCKS: "gw_local_blocks_list",      // 完整列表
                LOCAL_BLOCKS_HEAD: "gw_local_blocks_head", // 头部指纹
                TEMP_CURSOR: "gw_temp_cursor",           // 断点游标
                TEMP_LIST: "gw_temp_list",               // 断点临时名单
                TEMP_TIME: "gw_temp_time",               // 断点时间戳
                PANEL_COLLAPSED: "gw_panel_collapsed"    // 面板状态
            };
        }

        static get DELAY() {
            return { MIN: 15000, MAX: 21000 };
        }

        static get UI() {
            return {
                PANEL_ID: "gw-panel",
                LOG_ID: "gw-logs",
                BAR_ID: "gw-bar",
                TXT_ID: "gw-pct-txt",
                BTN_START_ID: "gw-btn",
                BTN_CLEAR_ID: "gw-btn-clear",
                TOGGLE_ID: "gw-toggle-btn",
                BODY_ID: "gw-content-body",
                USE_LOCAL_ID: "gw-use-local"  // 新增：使用本地缓存的复选框ID
            };
        }
    }

    /**
     * 工具模块
     */
    class Utils {
        static shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        static getCsrfToken() {
            const match = document.cookie.match(/(^|;\s*)ct0=([^;]*)/);
            return match ? match[2] : null;
        }

        static sleep(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        static getRandomDelay() {
            return Math.floor(Math.random() * (Config.DELAY.MAX - Config.DELAY.MIN + 1) + Config.DELAY.MIN);
        }

        static getTimeString() {
            return new Date().toLocaleTimeString('en-GB', { hour12: false });
        }
    }

    /**
     * 存储管理模块 (Wrapper for GM_ functions)
     */
    class Storage {
        static get(key, defaultValue = null) {
            return GM_getValue(key, defaultValue);
        }

        static set(key, value) {
            GM_setValue(key, value);
        }

        static delete(key) {
            GM_deleteValue(key);
        }

        static clearCache() {
            const keys = Config.CACHE_KEYS;
            Storage.delete(keys.LOCAL_BLOCKS);
            Storage.delete(keys.LOCAL_BLOCKS_HEAD);
            Storage.delete(keys.TEMP_CURSOR);
            Storage.delete(keys.TEMP_LIST);
            Storage.delete(keys.TEMP_TIME);
            Storage.delete(keys.PANEL_COLLAPSED);
        }
    }

    /**
     * UI 管理模块
     */
    class UserInterface {
        constructor(coreDelegate) {
            this.core = coreDelegate; // 引用核心逻辑用于绑定事件
            this.isCollapsed = Storage.get(Config.CACHE_KEYS.PANEL_COLLAPSED, false);
        }

        init() {
            if (document.getElementById(Config.UI.PANEL_ID)) return;
            this.render();
            this.bindEvents();
        }

        render() {
            const panel = document.createElement('div');
            panel.id = Config.UI.PANEL_ID;

            // 样式设置
            Object.assign(panel.style, {
                position: "fixed",
                bottom: "5px",
                left: "0px",
                margin: "0px",
                zIndex: "99999",
                background: "rgba(0, 0, 0, 0.95)", color: "#fff", padding: "10px", borderRadius: "8px",
                width: "184px",
                fontSize: "12px", border: "1px solid #444", fontFamily: "monospace",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                boxSizing: "content-box"
            });

            const version = GM_info.script.version;
            const toggleIcon = this.isCollapsed ? "+" : "-";
            const displayStyle = this.isCollapsed ? "none" : "block";

            panel.innerHTML = `
                <div style="border-bottom:1px solid #444;margin-bottom:8px;padding-bottom:5px;display:flex;justify-content:space-between;align-items:center;user-select:none;">
                    <span style="font-weight:bold;color:#e0245e;">GlassWall v${version}</span>
                    <div style="display:flex;gap:10px;align-items:center;">
                        <span id="${Config.UI.TXT_ID}" style="color:#aaa;font-size:10px;">Ready</span>
                        <span id="${Config.UI.TOGGLE_ID}" style="cursor:pointer;color:#6abbff;font-weight:bold;padding:0 4px;">${toggleIcon}</span>
                    </div>
                </div>

                <div id="${Config.UI.BODY_ID}" style="display:${displayStyle}">
                    <div style="display:flex;align-items:center;gap:5px;margin-bottom:8px;">
                        <input type="checkbox" id="${Config.UI.USE_LOCAL_ID}" checked>
                        <label for="${Config.UI.USE_LOCAL_ID}" style="color:#ccc;font-size:11px;">使用本地Blocked缓存</label>
                    </div>
                    <div id="${Config.UI.LOG_ID}" style="height:360px;overflow-y:auto;color:#ccc;margin-bottom:8px;font-size:11px;background:#111;padding:6px;border:1px solid #333;white-space:pre-wrap;">等待指令...\n--------------------\n<a href="https://github.com/anonym-g/X-Accounts-Based-in-China-Auto-Mute" target="_blank" style="color:#6abbff;text-decoration:none;">GitHub Repo</a>\nBy <a href="https://x.com/trailblaziger" target="_blank" style="color:#6abbff;text-decoration:none;">@trailblaziger</a></div>
                    <div style="background:#333;height:6px;margin-bottom:8px;border-radius:3px;overflow:hidden">
                        <div id="${Config.UI.BAR_ID}" style="width:0%;background:#e0245e;height:100%;transition:width 0.2s"></div>
                    </div>
                    <div style="display:flex;gap:5px">
                        <button id="${Config.UI.BTN_START_ID}" style="flex:1;display:flex;justify-content:center;align-items:center;background:#e0245e;color:white;border:none;padding:8px;cursor:pointer;font-weight:bold;border-radius:4px;">开始处理</button>
                        <button id="${Config.UI.BTN_CLEAR_ID}" style="flex:0.6;display:flex;justify-content:center;align-items:center;background:#555;color:white;border:none;padding:8px;cursor:pointer;border-radius:4px;">清除缓存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);
        }

        bindEvents() {
            // 开始按钮
            document.getElementById(Config.UI.BTN_START_ID).onclick = () => this.core.startProcess();
            // 清除缓存按钮
            document.getElementById(Config.UI.BTN_CLEAR_ID).onclick = () => this.core.clearCache();
            // 折叠按钮
            document.getElementById(Config.UI.TOGGLE_ID).onclick = () => this.togglePanel();
        }

        togglePanel() {
            const body = document.getElementById(Config.UI.BODY_ID);
            const btn = document.getElementById(Config.UI.TOGGLE_ID);
            const isNowCollapsed = body.style.display !== "none";

            if (isNowCollapsed) {
                body.style.display = "none";
                btn.innerText = "+";
                Storage.set(Config.CACHE_KEYS.PANEL_COLLAPSED, true);
            } else {
                body.style.display = "block";
                btn.innerText = "-";
                Storage.set(Config.CACHE_KEYS.PANEL_COLLAPSED, false);
            }
        }

        log(text, isError = false) {
            const el = document.getElementById(Config.UI.LOG_ID);
            if(el) {
                const time = Utils.getTimeString();
                const color = isError ? "#ff5555" : "#cccccc";
                el.innerHTML = `<div style="color:${color}"><span style="color:#666">[${time}]</span> ${text}</div>` + el.innerHTML;
            }
        }

        updateProgress(percent, text) {
            const bar = document.getElementById(Config.UI.BAR_ID);
            const txt = document.getElementById(Config.UI.TXT_ID);
            if(bar) bar.style.width = `${percent}%`;
            if(txt && text) txt.innerText = text;
        }

        setButtonDisabled(disabled) {
            const btn = document.getElementById(Config.UI.BTN_START_ID);
            if(btn) btn.disabled = disabled;
        }

        setStartButtonToStop() {
            const btn = document.getElementById(Config.UI.BTN_START_ID);
            if (btn) {
                btn.textContent = '停止处理';
                btn.style.background = '#e0245e'; // 保持红色，或改成其他颜色如'#555'
            }
        }

        resetStartButton() {
            const btn = document.getElementById(Config.UI.BTN_START_ID);
            if (btn) {
                btn.textContent = '开始处理';
                btn.style.background = '#e0245e';
                btn.onclick = () => this.core.startProcess();
                btn.disabled = false;
            }
        }
    }

    /**
     * Twitter API 交互模块（保持原样）
     */
    class TwitterApi {
        constructor(logger) {
            this.logger = logger;
        }

        getHeaders(csrf) {
            return {
                'authorization': Config.TWITTER.BEARER_TOKEN,
                'x-csrf-token': csrf
            };
        }

        async blockUser(user, csrf, signal) {
            const params = new URLSearchParams();
            params.append('screen_name', user);

            const res = await fetch(Config.TWITTER.API_BLOCK_CREATE, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(csrf),
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: params,
                signal
            });
            return res;
        }
    }

    /**
     * 外部数据源模块（保持原样）
     */
    class ExternalSource {
        constructor(logger) {
            this.logger = logger;
        }

        async _fetch(url) {
            return new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: "GET", url: url, timeout: 30000,
                    onload: r => resolve(r.status === 200 ? r.responseText : null),
                    onerror: () => resolve(null),
                    ontimeout: () => resolve(null)
                });
            });
        }

        async fetchAll() {
            this.logger.log("正在从 2 个数据源获取五毛名单...");
            const all = new Set();

            const [data1, data2] = await Promise.all([
                this._fetch(Config.REMOTE_SOURCES.FULL_LIST),
                this._fetch(Config.REMOTE_SOURCES.SECOND_LIST)
            ]);

            if (data1) {
                try {
                    const json = JSON.parse(data1);
                    if (json.users) json.users.forEach(u => u.userName && all.add(u.userName.toLowerCase()));
                } catch (e) { this.logger.log("[来源1] 解析失败", true); }
            }

            if (data2) {
                try {
                    data2.trim().split('\n').forEach(line => {
                        if(!line) return;
                        try {
                            const d = JSON.parse(line);
                            if(d.username) all.add(d.username.toLowerCase());
                        } catch(err){}
                    });
                } catch (e) { this.logger.log("[来源2] 解析失败", true); }
            }
            return all;
        }
    }

    /**
     * 核心业务逻辑 (Main Controller)
     */
    class Core {
        constructor() {
            this.ui = new UserInterface(this);
            this.api = new TwitterApi(this.ui);
            this.source = new ExternalSource(this.ui);
            this.stopRequested = false;
            this.abortController = null;

            // 启动 UI
            setInterval(() => this.ui.init(), 1000);
            GM_registerMenuCommand("打开面板", () => this.ui.init());
        }

        async clearCache() {
            this.ui.log("正在清除所有本地缓存...");
            Storage.clearCache();
            this.ui.log("缓存已清除！页面将在 2 秒后刷新。");
            setTimeout(() => window.location.reload(), 2000);
        }

        async saveToCache(set) {
            const fullList = Array.from(set);
            const newHeadList = fullList.slice(0, 100);
            Storage.set(Config.CACHE_KEYS.LOCAL_BLOCKS, fullList);
            Storage.set(Config.CACHE_KEYS.LOCAL_BLOCKS_HEAD, JSON.stringify(newHeadList));
            this.ui.log(`${set.size} 人`);
        }

        async startProcess() {
            this.stopRequested = false;
            this.abortController = new AbortController();

            const btn = document.getElementById(Config.UI.BTN_START_ID);
            btn.disabled = true;
            this.ui.setStartButtonToStop();
            btn.onclick = () => this.stopProcess();
            btn.disabled = false;

            const csrf = Utils.getCsrfToken();

            if (!csrf) {
                this.ui.log("无法获取 CSRF Token，请刷新页面。", true);
                this.ui.resetStartButton();
                return;
            }

            // 获取使用本地缓存的选项
            const useLocal = document.getElementById(Config.UI.USE_LOCAL_ID).checked;

            try {
                // 1. 获取已拉黑列表：根据选项使用本地缓存或从页面重新获取
                const localBlocked = await this.getBlockedAccounts(useLocal);
                this.ui.log(`已拉黑名单读取完毕: 共 ${localBlocked.size} 人`);

                // 2. 获取五毛列表
                const wumaoUsers = await this.source.fetchAll();
                if (wumaoUsers.size === 0) throw new Error("未获取任何数据，请检查网络或 API");
                this.ui.log(`五毛名单下载完毕: 共 ${wumaoUsers.size} 人`);

                // 3. 过滤
                this.ui.log("正在比对数据...");
                const todoList = [];
                let skipped = 0;
                wumaoUsers.forEach(u => {
                    if (localBlocked.has(u.toLowerCase())) skipped++;
                    else todoList.push(u);
                });

                this.ui.log(`过滤完成: 跳过 ${skipped} 人 (已存在)`);
                this.ui.log(`实际待处理: ${todoList.length} 人`);

                if (todoList.length === 0) {
                    this.ui.log("你的拉黑列表已是最新，无需操作！");
                    alert("所有目标均已在你的拉黑列表中。");
                    this.ui.updateProgress(100, "无需操作");
                    this.ui.resetStartButton();
                    return;
                }

                Utils.shuffleArray(todoList);
                this.ui.log("已将待处理列表随机打乱");
                this.ui.log(`正在自动启动处理... 共 ${todoList.length} 个目标`);

                // 4. 执行
                await this._executeSerialBlock(todoList, csrf, localBlocked);

            } catch (e) {
                this.ui.log(`发生异常: ${e.message}`, true);
                console.error(e);
                this.stopRequested = false;
                this.ui.resetStartButton();
            }
        }

        stopProcess() {
            this.stopRequested = true;
            if (this.abortController) {
                this.abortController.abort();
            }
            this.ui.log("收到停止指令...");
        }

        // 新增：根据选项获取Blocked账号
        async getBlockedAccounts(useLocal) {
            const cachedList = Storage.get(Config.CACHE_KEYS.LOCAL_BLOCKS, null);
            if (useLocal && cachedList && cachedList.length > 0) {
                this.ui.log("使用本地Blocked缓存...");
                return new Set(cachedList.map(u => u.toLowerCase()));
            } else {
                this.ui.log("重新从页面获取Blocked账号...");
                return await this._getManualBlockedAccounts();
            }
        }

        // ==================== 唯一改动：2025年真正可用的提取函数 ====================
        async _getManualBlockedAccounts() {
            this.ui.log("正在从页面自动提取已拉黑账号（会自动滚动到底）...");

            if (!location.pathname.includes("/settings/blocked")) {
                this.ui.log("请打开 https://x.com/settings/blocked/all 后再点击「开始处理」", true);
                throw new Error("不在 blocked 页面");
            }

            const blockedSet = new Set();
            let lastSize = 0;
            let noNew = 0;

            while (true) {
                if (this.stopRequested) {
                    this.ui.log("手动停止提取");
                    throw new Error("手动停止");
                }

                // 2025年11月实测 100% 可用的选择器（兼容正常+已暂停账号）
                document.querySelectorAll('a[href^="/"][role="link"]')
                    .forEach(a => {
                        const href = a.getAttribute("href");
                        if (href && /^\/[A-Za-z0-9_]{1,15}$/.test(href)) {
                            const user = href.slice(1).toLowerCase();
                            if (!blockedSet.has(user)) blockedSet.add(user);
                        }
                    });

                const cur = blockedSet.size;
                if (cur > lastSize) {
                    this.ui.log(`已提取 ${cur} 个（+${cur - lastSize}）`);
                    lastSize = cur;
                    noNew = 0;
                } else {
                    noNew++;
                    if (noNew >= 5) {
                        this.ui.log(`提取完成，共 ${cur} 个 blocked 账号`);
                        break;
                    }
                }

                window.scrollBy(0, window.innerHeight);
                await Utils.sleep(3000 + Math.random() * 1000);
            }

            await this.saveToCache(blockedSet);
            return blockedSet;
        }

        async _executeSerialBlock(list, csrf, localBlockedSet) {
            this.stopRequested = false;
            this.abortController = new AbortController();

            let success = 0;
            let fail = 0;
            const orderedCacheList = Array.from(localBlockedSet);

            for(let i=0; i<list.length; i++) {
                if (this.stopRequested) {
                    this.ui.log("手动停止批量Block");
                    alert('已手动停止批量Block');
                    this.ui.updateProgress(0, "Stopped");
                    this.stopRequested = false;
                    this.ui.resetStartButton();
                    return;
                }
                const user = list[i];
                const pct = ((i+1) / list.length) * 100;
                this.ui.updateProgress(pct, `${Math.floor(pct)}% (${i+1}/${list.length})`);

                try {
                    const res = await this.api.blockUser(user, csrf, this.abortController.signal);
                    if(res.ok) {
                        success++;

                        const lowerUser = user.toLowerCase();

                        orderedCacheList.unshift(lowerUser);
                        localBlockedSet.add(lowerUser);
                        await this.saveToCache(new Set(orderedCacheList));

                        if(success % 10 === 0) this.ui.log(`${i+1}/${list.length}\n成功: ${success} | 失败: ${fail}`);
                    } else {
                        fail++;
                        this.ui.log(`失败 @${user}: HTTP ${res.status}`, true);
                        if(res.status === 429) {
                            this.ui.log("触发风控 (429)，暂停 600 秒...", true);
                            await this.interruptibleSleep(600000);
                            i--;
                        } else {
                          this.ui.log("未知HTTP 错误，操作已被中止");
                          break;
                        }
                    }

                } catch(err) {
                    if (err.name === 'AbortError') {
                        this.ui.log("操作已被中止");
                        break;
                    }
                    fail++;
                    this.ui.log(`网络错误 @${user}: ${err.message}`, true);
                    break;
                }

                await this.interruptibleSleep(Utils.getRandomDelay());
            }

            this.ui.updateProgress(100, "Done");
            this.ui.log(`全部完成! 成功: ${success}, 失败: ${fail}`);
            alert(`处理完毕！\n成功: ${success}\n失败: ${fail}`);
            this.stopRequested = false;
            this.ui.resetStartButton();
        }

        async interruptibleSleep(ms) {
            const interval = 500; // 每500ms检查一次
            let remaining = ms;
            while (remaining > 0) {
                if (this.stopRequested) {
                    return;
                }
                const sleepTime = Math.min(interval, remaining);
                await Utils.sleep(sleepTime);
                remaining -= sleepTime;
            }
        }
    }

    // --- 初始化脚本 ---
    new Core();

})();