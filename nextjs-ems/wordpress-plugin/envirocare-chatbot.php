<?php
/*
Plugin Name: Envirocare Chatbot Widget
Description: Adds Envirocare Labs chatbot widget to your WordPress site
Version: 1.0
Author: Envirocare Labs
*/

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EnvirocareChatbot {
    
    public function __construct() {
        add_action('wp_footer', array($this, 'add_chatbot_widget'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    
    public function enqueue_scripts() {
        // Add custom CSS for the chatbot widget
        wp_add_inline_style('wp-block-library', $this->get_chatbot_styles());
    }
    
    public function add_chatbot_widget() {
        // Only show on frontend, not in admin
        if (is_admin()) {
            return;
        }
        
        ?>
        <div id="envirocare-chatbot-container">
            <!-- Chatbot Toggle Button -->
            <button id="envirocare-chatbot-toggle" class="envirocare-chatbot-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
            </button>
            
            <!-- Chatbot Iframe Container -->
            <div id="envirocare-chatbot-iframe-container" class="envirocare-chatbot-hidden">
                <div class="envirocare-chatbot-header">
                    <span>Envirocare Labs Chat</span>
                    <button id="envirocare-chatbot-close" class="envirocare-chatbot-close-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <iframe 
                    id="envirocare-chatbot-iframe"
                    src="http://localhost:3000/chatbot-widget"
                    frameborder="0"
                    allowtransparency="true"
                    scrolling="no">
                </iframe>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const toggleBtn = document.getElementById('envirocare-chatbot-toggle');
            const iframeContainer = document.getElementById('envirocare-chatbot-iframe-container');
            const closeBtn = document.getElementById('envirocare-chatbot-close');
            const iframe = document.getElementById('envirocare-chatbot-iframe');
            
            // Toggle chatbot
            toggleBtn.addEventListener('click', function() {
                iframeContainer.classList.toggle('envirocare-chatbot-hidden');
                if (!iframeContainer.classList.contains('envirocare-chatbot-hidden')) {
                    // Iframe is now visible, focus it
                    setTimeout(() => {
                        iframe.focus();
                    }, 100);
                }
            });
            
            // Close chatbot
            closeBtn.addEventListener('click', function() {
                iframeContainer.classList.add('envirocare-chatbot-hidden');
            });
            
            // Close on escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && !iframeContainer.classList.contains('envirocare-chatbot-hidden')) {
                    iframeContainer.classList.add('envirocare-chatbot-hidden');
                }
            });
        });
        </script>
        <?php
    }
    
    private function get_chatbot_styles() {
        return '
        #envirocare-chatbot-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .envirocare-chatbot-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2d4891, #1e3a8a);
            border: none;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(45, 72, 145, 0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .envirocare-chatbot-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(45, 72, 145, 0.4);
        }
        
        .envirocare-chatbot-btn:active {
            transform: scale(0.95);
        }
        
        #envirocare-chatbot-iframe-container {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 400px;
            height: 600px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            transition: all 0.3s ease;
            transform: translateY(0);
            opacity: 1;
        }
        
        .envirocare-chatbot-hidden {
            transform: translateY(20px);
            opacity: 0;
            pointer-events: none;
        }
        
        .envirocare-chatbot-header {
            background: linear-gradient(135deg, #2d4891, #1e3a8a);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            font-size: 14px;
        }
        
        .envirocare-chatbot-close-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            border-radius: 5px;
            transition: background-color 0.2s ease;
        }
        
        .envirocare-chatbot-close-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        #envirocare-chatbot-iframe {
            width: 100%;
            height: calc(100% - 60px);
            border: none;
            background: white;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            #envirocare-chatbot-iframe-container {
                width: calc(100vw - 40px);
                height: calc(100vh - 120px);
                bottom: 80px;
                right: 20px;
                left: 20px;
            }
            
            .envirocare-chatbot-btn {
                width: 55px;
                height: 55px;
            }
        }
        
        @media (max-width: 480px) {
            #envirocare-chatbot-iframe-container {
                width: calc(100vw - 20px);
                height: calc(100vh - 100px);
                bottom: 70px;
                right: 10px;
                left: 10px;
            }
        }
        ';
    }
}

// Initialize the plugin
new EnvirocareChatbot();
?>
