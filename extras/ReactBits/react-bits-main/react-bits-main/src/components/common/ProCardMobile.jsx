import { LuArrowRight, LuSparkles } from 'react-icons/lu';
import { proLinkProps } from '../../utils/pro';
import { PRO_COUNTS } from '../../constants/Pro';
import './ProCardMobile.css';

const ProCardMobile = () => {
  return (
    <a {...proLinkProps('/', 'mobile-bar')} className="pro-mobile-bar" aria-label="Get React Bits Pro">
      <span className="pro-mobile-bar-badge">
        <LuSparkles size={11} />
        NEW
      </span>
      <span className="pro-mobile-bar-text">
        <strong>React Bits Pro</strong>
        <span className="pro-mobile-bar-sub">{PRO_COUNTS.total} pieces, one-time payment</span>
      </span>
      <span className="pro-mobile-bar-cta">
        Explore
        <LuArrowRight size={13} />
      </span>
    </a>
  );
};

export default ProCardMobile;
