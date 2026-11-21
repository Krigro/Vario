VARIO
# VARIO — E-commerce Web Application

VARIO is a responsive e-commerce front-end application developed as a Noroff course assignment. The project focuses on building a product browsing and purchasing experience with **HTML, CSS, and vanilla JavaScript**, using the **Noroff API** for product data and authentication.

## Live Website

[Visit VARIO](https://krigro.github.io/Vario/)

## Project Objectives

The assignment requires a responsive online store where users can browse products, view individual product details, register and log in, manage a shopping cart, and complete a checkout flow.

## Features

### Product Feed

- Product data retrieved from the Noroff Online Shop API.
- Product thumbnails linking to individual product pages.
- Responsive product grid.
- Interactive featured-product carousel.

### Product Details

- Individual product pages using product IDs from the URL.
- Product information sourced from the API, including prices and other available details.
- Add-to-cart functionality for authenticated users.
- Product sharing via a URL containing the product ID.

### User Accounts

- Registration and login using the Noroff Authentication API.
- Client-side form validation and feedback.
- Authentication information stored in the browser.
- Navigation that responds to login status.
- Logout functionality.
- Redirect back to the intended page after authentication when applicable.

### Shopping Cart and Checkout

- View products added to the cart.
- Update quantities and remove products.
- View the cart total.
- Clear the cart.
- Enter delivery information and select a payment option in the checkout form.
- Complete the front-end checkout flow and view an order confirmation page.

### Additional Functionality

- User-specific wishlist saved in browser local storage.
- Responsive layout for desktop and mobile.

**Note:** The checkout is a front-end demonstration. The assignment does not require real payment processing. Wishlist and other browser-stored data are local to the browser, not synchronized to a server.

## Technologies

- **HTML** 
- **CSS** 
- **Vanilla JavaScript** 
- **Noroff API v2** 
- **localStorage** 
- **Figma** 
- **GitHub Projects, Kanban** 
- **GitHub Pages**

No JavaScript or CSS frameworks are used.

## API

The application uses the Noroff API v2.

**API Base URL:** `https://v2.api.noroff.dev`

### Authentication

This project uses the Noroff Authentication API to manage user accounts.

- Register new users via POST /auth/register.
- Authenticate users via POST /auth/login.
- Store the access token and user information in localStorage.
- Update the navigation based on authentication status.
- Allow users to log out and clear their authentication data.

### API Documentation

- [Online Shop API](https://docs.noroff.dev/docs/v2/basic/online-shop)
- [Authentication API](https://docs.noroff.dev/docs/v2/authentication)
- [Swagger Documentation](https://v2.api.noroff.dev/docs/static/index.html#/online-shop)

## Pages

| Page | Path | Purpose |
| --- | --- | --- |
| Home / Product Feed | `/index.html` | Browse featured products and the product grid |
| Product Details | `/product/index.html` | View an individual product |
| Login | `/account/login.html` | Log in |
| Register | `/account/register.html` | Create an account |
| Cart | `/cart/index.html` | Review and update the shopping cart |
| Checkout | `/checkout/index.html` | Enter delivery and payment details |
| Success | `/success/index.html` | View purchase confirmation |
| Wishlist | `/wishlist/index.html` | View saved favorite products |

Additional pages and shared scripts may be present in the repository.

## Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/Krigro/Vario.git
   ```
2. Open the project folder in Visual Studio Code.

3. Run the project using a local development server, such as the **Live Server** VS Code extension, so JavaScript modules and API requests work as expected.

4. Open the local URL provided by the development server.

No dependency installation or build process is required.

## Design and Project Planning

**Figma Style Guide and Prototypes:** 

Desktop prototype:
(https://www.figma.com/proto/Vn3Ckg4ToRWg9fG8jQFGy0/Vario---Exam-project-1?node-id=3-3&p=f&t=MsU75O7rjRiajcEo-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=3%3A3&show-proto-sidebar=1) 

Mobile prototype:
(https://www.figma.com/proto/Vn3Ckg4ToRWg9fG8jQFGy0/Vario---Exam-project-1?node-id=161-77&p=f&t=6QP8uLI2hmOE4kFC-1&scaling=scale-down&content-scaling=fixed&page-id=161%3A75&starting-point-node-id=161%3A77&show-proto-sidebar=1)

Style guide:
(https://www.figma.com/proto/Vn3Ckg4ToRWg9fG8jQFGy0/Vario---Exam-project-1?node-id=176-160&p=f&t=JoxRruPfRMBFIymB-1&scaling=min-zoom&content-scaling=fixed&page-id=176%3A159)


- **GitHub Projects Kanban and Roadmap:** [VARIO Project Board](https://github.com/users/Krigro/projects/3)

The design deliverables include mobile and desktop high-fidelity prototypes and a style guide covering:

- Typography and font families.
- Primary and secondary colors.
- Branding and logo.
- Buttons and reusable UI components.
- Responsive layouts and visual consistency.

Project planning is managed through GitHub Projects using Kanban and Roadmap views.

## Testing

The application is designed to support a responsive and user-friendly shopping experience.

The following areas are included in the testing process:

- Responsive layouts across desktop and mobile screen sizes.
- Product fetching and API error handling.
- Product navigation and carousel functionality.
- User registration, login, and logout.
- Form validation and user feedback.
- Shopping cart functionality and quantity updates.
- Checkout form validation and order confirmation.
- Wishlist functionality for authenticated users.
- Navigation and accessibility.

Testing is performed locally and on the deployed GitHub Pages application.

## Author

Developed by Kristine as part of a Noroff front-end development assignment.