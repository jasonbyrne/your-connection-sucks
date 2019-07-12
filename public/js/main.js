
(function () {
    const video = document.querySelector('#player video');
    const stream = 'https://cdnsecakmi.kaltura.com/p/931702/sp/93170200/playManifest/entryId/0_mz5ekp8u/protocol/https/format/applehttp/flavorIds/0_muy92s9x,0_q49nnqee,0_bqhpvgm4,0_s94m2wo7/a.m3u8?uiConfId=43922141&playSessionId=d361e3d0-d56e-5b36-3a01-69e6bd95ac61:0fedc7e3-294c-c88d-417a-9404f0036a05&referrer=aHR0cHM6Ly93d3cud2VhdGhlcm5hdGlvbnR2LmNvbS92aWRlby8=&clientTag=html5:v0.43.0';

    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            try {
                video.play();
            } catch (ex) {
                // Ignore
            }
        });
    }
    // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
    // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element through the `src` property.
    // This is using the built-in support of the plain video element, without using hls.js.
    // Note: it would be more normal to wait on the 'canplay' event below however on Safari (where you are most likely to find built-in HLS support) the video.src URL must be on the user-driven
    // white-list before a 'canplay' event will be emitted; the last video event that can be reliably listened-for when the URL is not on the white-list is 'loadedmetadata'.
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        video.addEventListener('loadedmetadata', function () {
            try {
                video.play();
            } catch (ex) {
                // Ignore
            }
        });
    }
    
})();