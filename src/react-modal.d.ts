declare module 'react-modal' {
    import React from 'react';
  
    interface ModalProps {
      isOpen: boolean;
      onRequestClose: () => void;
      contentLabel?: string;
      ariaHideApp?: boolean;
      className?: string;
      overlayClassName?: string;
      shouldCloseOnOverlayClick?: boolean;
      shouldReturnFocusAfterClose?: boolean;
      [key: string]: any;
    }
  
    export default class Modal extends React.Component<ModalProps> {
      static setAppElement(element: string): void; 
    }
  }
  