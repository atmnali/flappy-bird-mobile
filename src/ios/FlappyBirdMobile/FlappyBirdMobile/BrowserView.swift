//
//  BrowserView.swift
//  FlappyBirdMobile
//
//  Created by Suleyman Ataman on 26/04/2026.
//

import SwiftUI
import WebKit

struct BrowserView: UIViewRepresentable {
    let url: URL
    let reloadToken: Int
    @Binding var isLoading: Bool
    @Binding var loadError: String?

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        loadWebApp(in: webView)

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.parent = self

        guard webView.url?.absoluteString != url.absoluteString || context.coordinator.reloadToken != reloadToken else {
            return
        }

        context.coordinator.reloadToken = reloadToken
        loadWebApp(in: webView)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    private func loadWebApp(in webView: WKWebView) {
        DispatchQueue.main.async {
            isLoading = true
            loadError = nil
        }

        let request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
        webView.load(request)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: BrowserView
        var reloadToken: Int

        init(_ parent: BrowserView) {
            self.parent = parent
            self.reloadToken = parent.reloadToken
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            parent.loadError = nil
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            show(error)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            show(error)
        }

        private func show(_ error: Error) {
            parent.isLoading = false
            parent.loadError = error.localizedDescription
        }
    }
}
