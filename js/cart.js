class CartRemoveButton extends HTMLElement{constructor(){super(),this.addEventListener("click",this.handleRemoveButtonClick.bind(this))}async handleRemoveButtonClick(event){event.preventDefault();const cartItems=this.closest("cart-items")||this.closest("cart-drawer-items");this.getAttribute("data-is-bundle")==="true"||this.getAttribute("data-has-gift-wrapping")?cartItems.updateQuantities(this.dataset.index,0,"minus",this):cartItems.updateQuantity(this.dataset.index,0,"minus")}}customElements.define("cart-remove-button",CartRemoveButton);class QuantityInput extends HTMLElement{constructor(){super(),this.input=this.querySelector("input"),this.changeEvent=new Event("change",{bubbles:!0}),this.querySelectorAll("button").forEach(button=>button.addEventListener("click",this.onButtonClick.bind(this))),this.input.addEventListener("input",this.onInputChange.bind(this)),this.input.addEventListener("blur",this.onBlur.bind(this))}onButtonClick(event){event.preventDefault();const previousValue=this.input.value;event.target.name==="plus"?this.input.stepUp():this.input.stepDown(),previousValue!==this.input.value&&this.input.dispatchEvent(this.changeEvent)}onInputChange(event){const value=event.target.value;/^\d*$/.test(value)||(event.target.value=value.replace(/[^\d]/g,""))}onBlur(event){const value=event.target.value;(!value||Number(value)<=0)&&(event.target.value=1,event.target.dispatchEvent(this.changeEvent))}}customElements.define("quantity-input",QuantityInput);class CartItems extends HTMLElement{constructor(){super(),this.lineItemStatusElement=document.getElementById("shopping-cart-line-item-status"),this.currentItemCount=Array.from(this.querySelectorAll('[name="updates[]"]')).reduce((total,quantityInput)=>total+parseInt(quantityInput.value),0),this.debouncedOnChange=debounce(event=>{this.onChange(event)},300),this.addEventListener("change",this.debouncedOnChange.bind(this)),document.addEventListener("ajaxProduct:added",({detail})=>{this.renderAndShowItems()}),document.addEventListener("cart:updateDrawer",()=>{this.renderAndShowItems(!0)}),document.addEventListener("ajaxProduct:cleared",()=>{this.renderAndShowItems()})}onChange(event){if(event.target.getAttribute("data-is-bundle")==="true"||event.target.getAttribute("data-has-gift-wrapping")){this.updateQuantities(event.target.dataset.index,event.target.value,document.activeElement.getAttribute("name"),event.target);return}this.updateQuantity(event.target.dataset.index,event.target.value,document.activeElement.getAttribute("name"))}getSectionsToRender(){return[{id:document.querySelector(".main-cart").dataset.id,selector:"#cart-items"},{id:document.querySelector(".main-cart").dataset.id,selector:"#cart-dynamic-offers"},{id:document.querySelector(".main-cart").dataset.id,selector:"#cart-footer"},{id:document.querySelector(".main-cart").dataset.id,selector:"#cart-additionals"},{id:document.querySelector(".main-cart").dataset.id,selector:"#cart-static-offers-bar"}]}getSectionInnerHTML(html,selector){return new DOMParser().parseFromString(html,"text/html").querySelector(selector).innerHTML}async renderAndShowItems(updateOnly=!1){try{const sections=this.getSectionsToRender().map(section=>section.id).join(","),json=await(await fetch(`?sections=${sections}`)).json();if(json.errors)throw json.errors;if(this.getSectionsToRender().forEach(section=>{const sectionId=`shopify-section-${section.id}`,elementToReplace=document.getElementById(sectionId).querySelector(section.selector)||document.getElementById(section.id);elementToReplace&&(elementToReplace.innerHTML=this.getSectionInnerHTML(json[section.id],section.selector))}),!updateOnly){const parentDrawer=this.closest("[data-drawer]");if(!parentDrawer)return;Woolman.ModalsAndDrawers.showModalOrDrawer(parentDrawer.getAttribute("id"))}}catch(errors){console.error(errors)}}async updateQuantities(line,quantity,name,element){try{this.enableLoading(line);let productsToRemove=null;productsToRemove=Object.assign(...element.getAttribute("data-items-keys").split(",").map(id=>({[`${id}`]:0})));const giftWrappingKey=element.getAttribute("data-gift-wrapping-key")||"",cart=await window.fetchCart();let updates=[];const itemKeys=element.getAttribute("data-items-keys").split(",");cart.items.forEach(item=>{itemKeys.includes(item.key)||item.key==giftWrappingKey?updates.push(quantity):updates.push(item.quantity)});const json=await(await fetch(`${window.Shopify.routes.root}cart/update.js`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({updates,sections:this.getSectionsToRender().map(section=>section.id),sections_url:window.location.pathname})})).json(),{sections,item_count,errors,items}=json;if(errors)throw errors;if(productsToRemove){const bundleItems=[];Object.entries(productsToRemove).forEach(([key,value])=>{const bundleLineItemData=document.querySelector(`cart-items [id="LineItemData-${key}"]`),childProductDetails=JSON.parse(bundleLineItemData.textContent),bundleTitle=childProductDetails.bundle_title,bundleHandle=childProductDetails.bundle_handle,price=childProductDetails.product.price;bundleItems.push({product:childProductDetails,name,quantity:value,price,bundled:!0,bundleProduct:{title:bundleTitle,handle:bundleHandle}})}),bundleItems.forEach(item=>document.dispatchEvent(new CustomEvent("datalayer:cartUpdate",{detail:item})))}this.renderAndShowItems(!0),document.dispatchEvent(new CustomEvent("cart:update",{detail:{json}})),this.updateLiveRegions(line,item_count);const lineItem=document.getElementById(`CartItem-${line}`);lineItem&&lineItem.querySelector(`[name="${name}"]`)&&lineItem.querySelector(`[name="${name}"]`).focus()}catch(error){console.error(error)}finally{this.disableLoading()}}async updateQuantity(line,quantity,name){this.enableLoading(line);try{const json=await(await fetch(`${routes.cart_change_url}`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({line,quantity,sections:this.getSectionsToRender().map(section=>section.id),sections_url:window.location.pathname})})).json(),{items,item_count,errors,attributes}=json;if(attributes._preorder==="true"){const product_ids=items.map(item=>`${item.product_id}`),last_preorder_ids=attributes._preorder_ids?.split(",").filter(Boolean)||[],current_preorder_ids=last_preorder_ids.filter(preorder_id=>product_ids.indexOf(preorder_id)>=0);last_preorder_ids.length!==current_preorder_ids.length&&await fetch(`${routes.cart_update_url}`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({attributes:{_preorder:current_preorder_ids.length>0||"",_preorder_ids:current_preorder_ids.join(",")}})})}if(errors)throw errors;const lineItem=document.getElementById(`CartItem-${line}`),productDetails=JSON.parse(lineItem.querySelector("[data-product-json]").textContent);document.dispatchEvent(new CustomEvent("datalayer:cartUpdate",{detail:{product:productDetails,name,quantity,price:items?.[line-1]?.price??productDetails.product.price,affiliatePartner:window.localStorage.getItem("affiliatePartner"),affiliateId:window.localStorage.getItem("affiliateId"),ttp:window.getCookieValue("_ttp"),ttclid:window.getCookieValue("ttclid"),eventId:crypto.randomUUID()}})),this.renderAndShowItems(!0),document.dispatchEvent(new CustomEvent("cart:update",{detail:{json}})),this.updateLiveRegions(line,item_count),lineItem&&lineItem.querySelector(`[name="${name}"]`)&&lineItem.querySelector(`[name="${name}"]`).focus()}catch(errors){console.error(errors)}finally{this.disableLoading()}}updateLiveRegions(line,itemCount){this.currentItemCount,this.currentItemCount=itemCount,this.lineItemStatusElement.setAttribute("aria-hidden",!0);const cartStatus=document.getElementById("cart-live-region-text");cartStatus.setAttribute("aria-hidden",!1),setTimeout(()=>{cartStatus.setAttribute("aria-hidden",!0)},1e3)}enableLoading(line){this.classList.add("is-processing"),this.querySelectorAll(`#CartItem-${line} .loading-overlay`).forEach(overlay=>overlay.classList.remove("hidden")),document.activeElement.blur()}disableLoading(){this.classList.remove("is-processing"),this.querySelectorAll(".loading-overlay").forEach(overlay=>overlay.classList.add("hidden"))}}customElements.define("cart-items",CartItems),customElements.get("cart-note")||customElements.define("cart-note",class extends HTMLElement{constructor(){super(),this.addEventListener("keyup",debounce(event=>{const body=JSON.stringify({note:event.target.value});fetch(`${routes.cart_update_url}`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body})},300))}}),customElements.get("cart-upsell-offer")||customElements.define("cart-upsell-offer",class extends HTMLElement{constructor(){super(),this.querySelector(".cartUpsellOfferBtn").addEventListener("click",this.addToCart.bind(this)),this.productVariantId=this.dataset.productVariantId,this.shouldRemove=this.dataset.shouldRemove,this.shouldRemove==="true"&&this.removeFromCart(),this.isSubmitted=!1,window.fetchCart().then(cart=>{cart.total_price===0&&cart.items.length===1&&cart.items[0].properties._upsell_offer===!0&&this.removeFromCart()})}async removeFromCart(){const json=await(await fetch(`${window.Shopify.routes.root}cart/clear.js`,{method:"POST"})).json();document.dispatchEvent(new CustomEvent("ajaxProduct:cleared",{detail:{json}}))}async addToCart(e){if(e.preventDefault(),this.isSubmitted){console.log("cart-upsell-offer isLoading");return}this.isSubmitted=!0;const json=await(await fetch(`${window.Shopify.routes.root}cart/add.js`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({items:[{id:this.productVariantId,quantity:1,properties:{_upsell_offer:!0}}]})})).json();console.log("cart-upsell-offer json",{json}),document.dispatchEvent(new CustomEvent("ajaxProduct:added",{detail:{json}}))}}),customElements.get("cart-recommendations")||customElements.define("cart-recommendations",class extends HTMLElement{constructor(){super(),this.loadRecommendations(),document.addEventListener("ajaxProduct:added",this.loadRecommendations.bind(this))}async loadRecommendations(){if(!(!this.dataset.productId||this.dataset.productId===""))try{const url=new URL(location.origin+routes.product_recommendations_url+".json");url.searchParams.set("product_id",this.dataset.productId),url.searchParams.set("limit",this.dataset.limit||10),url.searchParams.set("intent",this.dataset.intent||"related");const response=await fetch(url),{products}=await response.json();if(!products||products.length==0)throw"No product recommendations found for products in the cart";this.productsContainer=this.querySelector("[data-products-ajax]"),this.productsContainer.innerHTML="";let name="cart-recommendations";try{name=this.productsContainer.closest("details").querySelector(".summary__title").textContent.trim()}catch{}products.forEach((product,index)=>{const template=this.querySelector("template").content.firstElementChild.cloneNode(!0),filename=product.featured_image.split("/").pop(),filedata=filename.split("."),new_filename=`${filedata[0]}_150x150.${filedata[1]}`,url2=product.featured_image.replace(filename,new_filename);template.querySelector("img").setAttribute("src",url2),template.setAttribute("href",location.origin+product.url),template.setAttribute("title",product.title),this.productsContainer.appendChild(template),template.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("snowplowProductListClick",{detail:{name,product:{id:product.variants[0].sku,name:product.title,brand:product.vendor,price:product.price,category:product.type,position:index}}}))})});const intersectionCallback=entries=>{entries.forEach(entry=>{if(entry.isIntersecting){const snowplowProductListViewEvent={detail:{name:this.productsContainer.closest("details").querySelector(".summary__title").textContent.trim(),products:products.map((product,index)=>({id:product.variants[0].sku,name:product.title,brand:product.vendor,price:product.price,category:product.type,position:index}))}},event=new CustomEvent("snowplowProductListView",snowplowProductListViewEvent);document.dispatchEvent(event),intersection.unobserve(entry.target)}})},intersection=new IntersectionObserver(intersectionCallback);intersection.observe(this.productsContainer,{threshold:.2})}catch(error){this.setAttribute("hidden",!0),console.warn(error)}}});
//# sourceMappingURL=/cdn/shop/t/96/assets/cart.js.map?v=152289180280675113581744203218
