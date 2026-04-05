/**
 * Form Configuration (Optional)
 * This file demonstrates how to configure forms dynamically
 * Use this to reduce code duplication when managing multiple forms
 * 
 * To use:
 * 1. Import this file in form.html: <script src="formConfig.js"></script>
 * 2. Reference form definitions in form.js
 */

const FORM_CONFIGS = {
  // Form 1: Order Form
  order: {
    id: 'order',
    name: 'Order Form',
    title: 'Place Your Order',
    description: 'Complete the form below to place your order',
    fields: [
      {
        id: 'email',
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        readOnly: true,
        help: 'Your email is verified and cannot be changed',
        placeholder: 'your@email.com',
      },
      {
        id: 'productSelection',
        name: 'productSelection',
        type: 'select',
        label: 'Select Product',
        required: true,
        options: [
          { value: '', label: '-- Choose a product --', disabled: true },
          { value: 'meal_plan_basic', label: 'Meal Plan - Basic' },
          { value: 'meal_plan_premium', label: 'Meal Plan - Premium' },
          { value: 'catering_small', label: 'Catering - Small (5-10 people)' },
          { value: 'catering_large', label: 'Catering - Large (10+ people)' },
        ],
      },
      {
        id: 'deliveryMethod',
        name: 'deliveryMethod',
        type: 'radio',
        label: 'Delivery Method',
        required: true,
        options: [
          { value: 'pickup', label: 'Pickup' },
          { value: 'ship', label: 'Ship' },
          { value: 'schedule', label: 'Schedule Delivery' },
        ],
      },
      {
        id: 'quantity',
        name: 'quantity',
        type: 'number',
        label: 'Quantity',
        required: true,
        placeholder: '1',
        min: 1,
        max: 100,
      },
      {
        id: 'specialRequests',
        name: 'specialRequests',
        type: 'textarea',
        label: 'Special Requests',
        required: false,
        placeholder: 'Any special dietary requirements or notes...',
        rows: 4,
      },
    ],
    submitLabel: 'Submit Order',
    successMessage: 'Thank you! Your order has been submitted successfully.',
  },

  // Form 2: Feedback Form (Example for multiple forms)
  feedback: {
    id: 'feedback',
    name: 'Feedback Form',
    title: 'Send Us Your Feedback',
    description: 'We\'d love to hear from you',
    fields: [
      {
        id: 'email',
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        readOnly: true,
        placeholder: 'your@email.com',
      },
      {
        id: 'rating',
        name: 'rating',
        type: 'radio',
        label: 'How would you rate your experience?',
        required: true,
        options: [
          { value: '5', label: '5 - Excellent' },
          { value: '4', label: '4 - Good' },
          { value: '3', label: '3 - Average' },
          { value: '2', label: '2 - Poor' },
          { value: '1', label: '1 - Very Poor' },
        ],
      },
      {
        id: 'comments',
        name: 'comments',
        type: 'textarea',
        label: 'Additional Comments',
        required: false,
        placeholder: 'Tell us more about your experience...',
        rows: 5,
      },
    ],
    submitLabel: 'Send Feedback',
    successMessage: 'Thank you for your feedback!',
  },

  // Form 3: Reservation Form (Example)
  reservation: {
    id: 'reservation',
    name: 'Reservation Form',
    title: 'Make a Reservation',
    description: 'Book your table or event',
    fields: [
      {
        id: 'email',
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        readOnly: true,
      },
      {
        id: 'partySize',
        name: 'partySize',
        type: 'select',
        label: 'Party Size',
        required: true,
        options: [
          { value: '', label: '-- Select number of people --', disabled: true },
          { value: '1', label: '1 Person' },
          { value: '2', label: '2 People' },
          { value: '3', label: '3 People' },
          { value: '4', label: '4 People' },
          { value: '5-10', label: '5-10 People' },
          { value: '10+', label: 'More than 10' },
        ],
      },
      {
        id: 'reservationDate',
        name: 'reservationDate',
        type: 'date',
        label: 'Preferred Date',
        required: true,
      },
      {
        id: 'reservationTime',
        name: 'reservationTime',
        type: 'time',
        label: 'Preferred Time',
        required: true,
      },
      {
        id: 'eventType',
        name: 'eventType',
        type: 'select',
        label: 'Event Type',
        required: true,
        options: [
          { value: '', label: '-- Select event type --', disabled: true },
          { value: 'dining', label: 'Casual Dining' },
          { value: 'business', label: 'Business Meeting' },
          { value: 'celebration', label: 'Celebration' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'notes',
        name: 'notes',
        type: 'textarea',
        label: 'Special Requests or Notes',
        required: false,
        placeholder: 'Any dietary restrictions, allergies, or special requests...',
        rows: 4,
      },
    ],
    submitLabel: 'Request Reservation',
    successMessage: 'Your reservation request has been received. We\'ll confirm shortly.',
  },
};

/**
 * Get form configuration
 * @param {string} formId - Form identifier
 * @return {object} Form configuration object
 */
function getFormConfig(formId) {
  return FORM_CONFIGS[formId] || FORM_CONFIGS.order;
}

/**
 * Get all form IDs
 * @return {array} Array of available form IDs
 */
function getAvailableFormIds() {
  return Object.keys(FORM_CONFIGS);
}

/**
 * Export for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FORM_CONFIGS,
    getFormConfig,
    getAvailableFormIds,
  };
}
