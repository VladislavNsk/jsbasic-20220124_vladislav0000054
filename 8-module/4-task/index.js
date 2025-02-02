import createElement from '../../assets/lib/create-element.js';
import escapeHtml from '../../assets/lib/escape-html.js';

import Modal from '../../7-module/2-task/index.js';

export default class Cart {
  cartItems = [];
  modal = null;

  constructor(cartIcon) {
    this.onSubmit = this.onSubmit.bind(this);
    this.cartIcon = cartIcon;
    this.addEventListeners();
  }

  addProduct(product) {
    if(product){
      const cartItem = this.cartItems.find(x => x.product.id == product.id);
      if(cartItem == null){
        this.cartItems.push({product, count: 1});
      }else{
        cartItem.count++;
      }
  
      this.onProductUpdate(cartItem);
    }
  }

  updateProductCount(productId, amount) {
    const cartItem = this.cartItems.find(x => x.product.id == productId);
    if(cartItem){
      cartItem.count += amount;

      if(cartItem.count === 0){
        const cartItemItem = this.cartItems.indexOf(cartItem);
        this.cartItems.splice(cartItemItem, 1);
      }

      this.onProductUpdate(cartItem);
    }
  }

  isEmpty() {
    return !this.cartItems.some(x => x.count > 0);
  }

  getTotalCount() {
    return this.cartItems.reduce((sum, cartItem) => {
      return sum + cartItem.count;
    }, 0);
  }

  getTotalPrice() {
    return this.cartItems.reduce((sum, cartItem) => {
      return sum + cartItem.count * cartItem.product.price;
    }, 0);
  }

  renderProduct(product, count) {
    return createElement(`
    <div class="cart-product" data-product-id="${
      product.id
    }">
      <div class="cart-product__img">
        <img src="/assets/images/products/${product.image}" alt="product">
      </div>
      <div class="cart-product__info">
        <div class="cart-product__title">${escapeHtml(product.name)}</div>
        <div class="cart-product__price-wrap">
          <div class="cart-counter">
            <button type="button" class="cart-counter__button cart-counter__button_minus">
              <img src="/assets/images/icons/square-minus-icon.svg" alt="minus">
            </button>
            <span class="cart-counter__count">${count}</span>
            <button type="button" class="cart-counter__button cart-counter__button_plus">
              <img src="/assets/images/icons/square-plus-icon.svg" alt="plus">
            </button>
          </div>
          <div class="cart-product__price">€${product.price.toFixed(2)}</div>
        </div>
      </div>
    </div>`);
  }

  renderOrderForm() {
    return createElement(`<form class="cart-form">
      <h5 class="cart-form__title">Delivery</h5>
      <div class="cart-form__group cart-form__group_row">
        <input name="name" type="text" class="cart-form__input" placeholder="Name" required value="Santa Claus">
        <input name="email" type="email" class="cart-form__input" placeholder="Email" required value="john@gmail.com">
        <input name="tel" type="tel" class="cart-form__input" placeholder="Phone" required value="+1234567">
      </div>
      <div class="cart-form__group">
        <input name="address" type="text" class="cart-form__input" placeholder="Address" required value="North, Lapland, Snow Home">
      </div>
      <div class="cart-buttons">
        <div class="cart-buttons__buttons btn-group">
          <div class="cart-buttons__info">
            <span class="cart-buttons__info-text">total</span>
            <span class="cart-buttons__info-price">€${this.getTotalPrice().toFixed(
              2
            )}</span>
          </div>
          <button type="submit" class="cart-buttons__button btn-group__button button">order</button>
        </div>
      </div>
    </form>`);
  }

  renderModal() {
    this.modal = new Modal();      
    const body = createElement('<div class="orders_inner"></div>');
    this.modal.setTitle('Your order');  

    for (const cartItem of this.cartItems) {
      const product = this.renderProduct(cartItem.product, cartItem.count);
      body.append(product);      
    }    
    
    const form = this.renderOrderForm();
    
    body.append(form);
    this.modal.setBody(body);
    this.modal.open();
    
    document.querySelector('.orders_inner').addEventListener('click', event =>{
      const button = event.target.closest('button.cart-counter__button')
      if(button){
        const productId = event.target.closest('.cart-product').dataset.productId;
        if(button.classList.contains('cart-counter__button_plus')){
          this.updateProductCount(productId, 1);
        }else{
          this.updateProductCount(productId, -1);
        }

        const totalCount = this.getTotalCount();
        if(totalCount === 0){
          this.modal.close();
        }
      }
    });

    document.forms[0].onsubmit = this.onSubmit;
  }

  onProductUpdate(cartItem) {    
    if(document.body.classList.contains('is-modal-open')){
      const totalPrice = this.getTotalPrice();
      const modalBody = document.querySelector('.orders_inner');
      const productCount = modalBody.querySelector(`[data-product-id="${cartItem.product.id}"] .cart-counter__count`);
      const productPrice = modalBody.querySelector(`[data-product-id="${cartItem.product.id}"] .cart-product__price`); 
      const infoPrice = modalBody.querySelector(`.cart-buttons__info-price`); 

      productCount.innerHTML = cartItem.count;
      productPrice.innerHTML = `€${(cartItem.product.price * cartItem.count).toFixed(2)}`;
      infoPrice.innerHTML = `€${totalPrice.toFixed(2)}`;
    }
    this.cartIcon.update(this);
  }

  async onSubmit(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('is-loading');

    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      body: new FormData(event.target),
    });

    if(response.ok){
      this.modal.setTitle('Success!');
      this.cartItems = [];
      this.modal.setBody(createElement(`
        <div class="modal__body-inner">
          <p>
            Order successful! Your order is being cooked :) <br>
            We’ll notify you about delivery time shortly.<br>
            <img src="/assets/images/delivery.gif">
          </p>
        </div>
      `));
    }
  };

  addEventListeners() {
    this.cartIcon.elem.onclick = () => this.renderModal();
  }
}