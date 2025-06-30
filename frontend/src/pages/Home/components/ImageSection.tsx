import { motion } from 'framer-motion';
import '../../../index.css'
function ImageSection() {
  return (
    <motion.div
      className="w-full md:w-1/2 relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <div className="relative z-10 rounded-xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition duration-300">
        <img
          src="https://static.vecteezy.com/system/resources/previews/005/877/721/non_2x/video-chatting-modern-flat-concept-for-web-banner-design-group-of-friends-communicate-in-online-call-write-messages-remote-employees-confer-online-illustration-with-isolated-people-scene-vector.jpg"
          alt="Chat app UI"
          className="w-full h-auto object-cover rounded-xl"
        />
      </div>
      <div className="absolute -right-6 -bottom-6 w-64 h-64 rounded-full bg-blue-900/20 -z-10"></div>
      <div className="absolute -left-6 -top-6 w-40 h-40 rounded-full bg-indigo-700/20 -z-10"></div>
    </motion.div>
  );
}

export default ImageSection;