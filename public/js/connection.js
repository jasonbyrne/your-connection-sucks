$(function () {


    let wasSlowConnection = false;
    let lastBars = null;
    const $player = $('#player');
    const bandwidthTestFile = 'https://stream-archive-input-test.s3.amazonaws.com/test.jpg';
    const bandwidthTestDownloadSize = 4995374;

    // Image preloader
    [
        'img/bars-0.png',
        'img/bars-1.png',
        'img/bars-2.png',
        'img/bars-3.png'
    ].forEach(function (uri) {
        var img = new Image();
        img.src = uri;
    });

    function getDownloadSpeed(callback) {
        const startTime = (new Date()).getTime();
        const download = new Image();
        console.log(`Started download at ${startTime}`);
        download.onload = function () {
            const endTime = (new Date()).getTime();
            const duration = (endTime - startTime) / 1000;
            const bitsLoaded = bandwidthTestDownloadSize * 8;
            const speedBps = (bitsLoaded / duration).toFixed(2);
            const speedKbps = (speedBps / 1024).toFixed(2);
            const speedMbps = (speedKbps / 1024).toFixed(2);
            console.log(`Finished download at ${endTime}`);
            callback({
                mb: bitsLoaded / 1024,
                length: bitsLoaded,
                seconds: duration,
                bps: speedBps,
                kbps: speedKbps,
                mbps: speedMbps
            });
        }
        download.onerror = function (err, msg) {
            alert('Speed test failed.');
            console.log(msg, err);
        }
        download.src = bandwidthTestFile + '?nnn=' + startTime;
    }

    function showConnectionAlert(bars) {
        const isSlowConnection = (bars < 3);
        let alertLevel = null,
            alertMessage = null;
        // They were on a good connection, but now bad connection
        if (
            isSlowConnection && !wasSlowConnection ||
            (isSlowConnection && bars != lastBars && lastBars !== null)
        ) {
            if (bars == 0) {
                alertMessage = 'Appears you are offline. Please connect to the internet.';
                alertLevel = 'danger';
            }
            else if (bars == 1) {
                alertMessage = 'Slow connection detected. Video will likely buffer frequently.';
                alertLevel = 'danger';
            }
            else if (bars == 2) {
                alertMessage = 'Slow connection detected. Video quality may be impacted.';
                alertLevel = 'danger';
            }
        }
        // They had a slow connection, but it has been restored
        else if (wasSlowConnection && !isSlowConnection) {
            alertMessage = 'Your connection has recovered.';
            alertLevel = 'success';
        }

        // We should alert them of status
        if (alertLevel !== null) {
            let $alert = $(`
                <div class="alert alert-${alertLevel} connectionAlert" role="alert">
                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                    <img src="img/bars-${bars}.png" class="icon" />
                    ${alertMessage}
                    <a href="#" class="details">Details</a>
                </div>
            `);
            // Apped or replace the alert message
            const previousAlert = $('.connectionAlert');
            (previousAlert.length > 0) ?
                previousAlert.replaceWith($alert) :
                $alert.appendTo($player);
            // If we're telling them connection is good, auto-hide
            if (bars >= 3) {
                setTimeout(function () {
                    $alert.fadeOut();
                }, 4000);
            }
        }
    }

    // Get connection
    function getConnection() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const me = {};
        me.isSupported = !!conn;
        me.onchange = (function () {
            return !!conn ? conn.onchange : null;
        })();
        me.effectiveType = (function () {
            if (!navigator.onLine) {
                return 'offline';
            }
            return !!conn ?
                (conn.effectiveType || conn.type) :
                'unknown';
        })();
        me.rtt = (function () {
            if (!navigator.onLine) {
                return 0;
            }
            if (conn) {
                return conn.rtt;
            }
            return !!conn ?
                (conn.rtt) :
                null;
        })();
        me.downlink = (function () {
            if (!navigator.onLine) {
                return 0;
            }
            return !!conn ?
                (conn.downlink) :
                null;
        })();
        me.isOffline = function () {
            return !navigator.onLine || me.downlink == 0 || me.rtt == 0;
        };
        me.getConnectionSpeed = function () {
            return me.downlink ?
                me.downlink + ' Mbps' :
                'Unknown';
        }
        me.getBars = function () {
            // Offline: Works in ancient browsers
            if (me.isOffline()) {
                return 0;
            }
            // If for some reason we didn't get a connection, F-it
            if (me.effectiveType == 'unknown') {
                return 3;
            }
            // 1 Bar
            if (/2g/.test(me.effectiveType)) {
                return 1;
            }
            // 2 Bars
            if (/3g/.test(me.effectiveType)) {
                return 2;
            }
            // 3 Bars
            return 3;
        };
        me.saveData = (function () {
            return !!conn ? conn.saveData : false;
        })();
        return me;
    };

    function onConnectionChange() {
        const conn = getConnection();
        const bars = conn.getBars();
        showConnectionAlert(bars);
        // Save this change for next time
        wasSlowConnection = (bars < 3);
        lastBars = bars;
    }
    
    if (!!navigator.connection) {
        navigator.connection.addEventListener('change', onConnectionChange);
    }
    window.addEventListener('offline', onConnectionChange);
    window.addEventListener('online', onConnectionChange);
    onConnectionChange();
    
    const browser = (function () {
        var sBrowser, sUsrAg = navigator.userAgent;

        // The order matters here, and this may report false positives for unlisted browsers.

        if (sUsrAg.indexOf("Firefox") > -1) {
            sBrowser = "Mozilla Firefox";
            // "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
        } else if (sUsrAg.indexOf("Opera") > -1 || sUsrAg.indexOf("OPR") > -1) {
            sBrowser = "Opera";
            //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 OPR/57.0.3098.106"
        } else if (sUsrAg.indexOf("Trident") > -1) {
            sBrowser = "Microsoft Internet Explorer";
            // "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; Zoom 3.6.0; wbx 1.0.0; rv:11.0) like Gecko"
        } else if (sUsrAg.indexOf("Edge") > -1) {
            sBrowser = "Microsoft Edge";
            // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
        } else if (sUsrAg.indexOf("Chrome") > -1) {
            sBrowser = "Google Chrome";
            // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"
        } else if (sUsrAg.indexOf("Safari") > -1) {
            sBrowser = "Apple Safari";
            // "Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1 980x1306"
        } else {
            sBrowser = "unknown";
        }
        return sBrowser;
    })();

    const os = (function () {
        return window.navigator.oscpu || window.navigator.platform;
    })();

    function getDetails(e) {
        e.preventDefault();
        if (confirm('Run a speed test?')) {
            const $video = $('video');
            console.log('Pausing video');
            $video[0].pause();
            console.log('Running speed test...');
            getDownloadSpeed(function (speed) {
                console.log('Speed test complete', speed);
                const conn = getConnection();
                alert('' +
                    `Browser: ${browser}
    Platform: ${os}
    Connection Speed: ${Math.round(speed.mbps * 100) / 100} mbps
    Effective Connection: ${conn.effectiveType}
    User Agent: ${navigator.userAgent}
                    `);
                $video[0].play();
            });
        }
    };

    $(document).bind('keydown', function (e) {
        if ((event.ctrlKey || event.metaKey) && (event.which == 191 || event.wich == 220)) {
            getDetails(e);
        }
    });

    $('body').on('click', '.connectionAlert .details', getDetails);
    $('body').on('click', '.runConnectionTest', getDetails);

});
