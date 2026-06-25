import React from 'react';
import { XMarkIcon, SparklesIcon, DocumentTextIcon, CreditCardIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0a0a0f] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <h2 className="text-3xl font-extrabold text-white mb-2">User Guide</h2>
        <p className="text-zinc-400 mb-8 font-light">Everything you need to know to get the most out of NovaForge.</p>
        
        <div className="space-y-8 text-zinc-300 font-light leading-relaxed">
          
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <InformationCircleIcon className="w-6 h-6 text-blue-400" /> App Purpose
            </h3>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
              <p>
                <strong>NovaForge</strong> uses the advanced Gemini 3 Pro AI to transform images, sketches, notes, or ideas into fully functional, interactive, and beautifully styled web applications. Whether you want to turn a photo of a messy desk into a clean-up game, or a whiteboard wireframe into a working React dashboard, NovaForge builds it instantly.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-purple-400" /> How to Generate Artifacts
            </h3>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Sign In:</strong> Make sure you are signed in using your Google account to access your credits.</li>
                <li><strong>Provide Input:</strong> In the text area at the bottom of the screen, describe what you want to build.</li>
                <li><strong>Upload a Reference (Optional):</strong> Click the attachment icon to upload a photo, sketch, or document. Our AI will analyze the image and generate a matching app.</li>
                <li><strong>Generate:</strong> Press the "Generate" button (the upward arrow). Each generation costs <strong>1 credit</strong>.</li>
                <li><strong>Preview:</strong> The AI will write the code and display the live result in the preview window.</li>
              </ol>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <CreditCardIcon className="w-6 h-6 text-green-400" /> Purchasing Credits
            </h3>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
              <p>Generations require computational power. We give you 3 free credits to start, after which you will need to purchase more.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Top Right Menu:</strong> Locate the Google Pay button in the navigation bar.</li>
                <li><strong>Instant Top-Up:</strong> Clicking the button allows you to quickly and securely purchase a batch of <strong>10 credits</strong> for a fixed price.</li>
                <li><strong>Backend Security:</strong> Your credits are updated immediately in our secure Firestore database, meaning you can use them on any device.</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-yellow-400" /> Exporting to Google Workspace
            </h3>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
              <p>Once you are happy with a generated artifact, you can save it directly to your Google Workspace:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Export to Google Drive:</strong> Click the Drive icon (triangle shape) in the top-right of the Live Preview. This saves the generated HTML file straight into your Google Drive root folder.</li>
                <li><strong>Export to Google Docs:</strong> Click the Docs icon (document shape) to create a new Google Document containing the HTML structure of your artifact for documentation purposes.</li>
                <li><em>Note: You must grant the application permission to access your Drive and Docs when signing in for these features to work.</em></li>
              </ul>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
};
