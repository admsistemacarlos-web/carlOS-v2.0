
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // 1. Resetar scroll da janela (importante para mobile e comportamentos globais)
    window.scrollTo(0, 0);
    document.body.scrollTo(0, 0);

    // 2. Resetar scroll do container principal dos Layouts (PersonalLayout e ProfessionalLayout)
    // Seus layouts usam uma tag <main> com 'overflow-auto', então é ela que segura o scroll.
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Instantâneo para não parecer que o usuário está sendo "arrastado"
      });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
