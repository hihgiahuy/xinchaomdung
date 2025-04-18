
    (function() {
      var baseURL = "https://cdn.shopify.com/shopifycloud/checkout-web/assets/";
      var scripts = ["https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/polyfills.CPIGHvSH.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/app.CbSbZRKX.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/page-OnePage.LagoVYTZ.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/DeliveryMethodSelectorSection.ClrG6VAB.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/useEditorShopPayNavigation.D17A230v.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/VaultedPayment.8cZPx7aU.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/LocalizationExtensionField.D3EUvaft.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/ShopPayOptInDisclaimer.DrqYHNOU.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/ShipmentBreakdown.CVviSgBx.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/MerchandiseModal.CPf-eOIe.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/StackedMerchandisePreview.B_Rvv5GO.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/PayButtonSection.B_GrJiI8.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/component-ShopPayVerificationSwitch.Dqqgn49G.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/useSubscribeMessenger.KhNq0QQi.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/index.BJZexIFo.js"];
      var styles = ["https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/assets/app.CXL-GAUL.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/assets/OnePage.PMX4OSBO.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/assets/DeliveryMethodSelectorSection.DmqjTkNB.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/assets/useEditorShopPayNavigation.DCOTvxC3.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/assets/VaultedPayment.OxMVm7u-.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/assets/StackedMerchandisePreview.CKAakmU8.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1.de/assets/ShopPayVerificationSwitch.DW7NMDXG.css"];
      var fontPreconnectUrls = ["https://cdn.shopify.com"];
      var fontPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0689/3826/8979/files/Jost-Light.woff2?v=1741862244"];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0689/3826/8979/files/checkout-logo_x320.png?v=1716295925"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = [baseURL].concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  