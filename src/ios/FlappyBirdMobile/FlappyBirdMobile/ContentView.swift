//
//  ContentView.swift
//  FlappyBirdMobile
//
//  Created by Suleyman Ataman on 26/04/2026.
//

import SwiftUI

struct ContentView: View {
    private let webAppURL = URL(string: "http://192.168.0.225:5173/")!
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var reloadToken = 0

    var body: some View {
        ZStack {
            Color(red: 112 / 255, green: 197 / 255, blue: 206 / 255)
                .ignoresSafeArea()

            BrowserView(
                url: webAppURL,
                reloadToken: reloadToken,
                isLoading: $isLoading,
                loadError: $loadError
            )
            .ignoresSafeArea()

            if isLoading {
                ProgressView("Loading game...")
                    .padding(18)
                    .background(.regularMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }

            if let loadError {
                VStack(spacing: 12) {
                    Text("Could not load web app")
                        .font(.headline)
                    Text(webAppURL.absoluteString)
                        .font(.caption)
                        .textSelection(.enabled)
                    Text(loadError)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                    Text("Start the Vite server with `npm run dev`, then retry.")
                        .font(.caption)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        reloadToken += 1
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(20)
                .frame(maxWidth: 320)
                .background(.regularMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .padding()
            }
        }
    }
}
